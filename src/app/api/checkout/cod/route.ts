import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE_NAME, getSessionUser } from "@/lib/auth";
import { computeDiscount, getAvailableStock, lockProductRow, releaseExpiredLocks } from "@/lib/cart-engine";
import { sendEmail } from "@/lib/email";

const codSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10).max(20),
  shippingAddress: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/),
  consentAccepted: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = codSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid checkout details." },
        { status: 400 }
      );
    }

    const codRecord = await prisma.codPincode.findUnique({
      where: { pincode: parsed.data.pincode },
    });
    if (!codRecord || !codRecord.isActive) {
      return NextResponse.json(
        { error: "Cash on Delivery is not available for this pincode. Please pay online via Razorpay." },
        { status: 400 }
      );
    }

    const sessionToken = cookies().get(CART_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Cart session missing." }, { status: 400 });
    }

    const user = await getSessionUser();
    const settings = await prisma.siteSetting.findUnique({ where: { id: "default" } });

    const order = await prisma.$transaction(async (tx) => {
      await releaseExpiredLocks(tx);

      const cart = await tx.cart.findUnique({
        where: { sessionToken },
        include: { items: { include: { product: true }, orderBy: { productId: "asc" } } },
      });
      if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty.");
      }

      for (const item of cart.items) {
        await lockProductRow(tx, item.productId);
        const available = await getAvailableStock(item.productId, cart.id, tx);
        if (available < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product.name}. Only ${available} available.`);
        }
      }

      const subtotalInr = cart.items.reduce((sum, i) => sum + i.product.priceInr * i.quantity, 0);
      const { discountInr, appliedCode } = await computeDiscount({
        code: cart.appliedCode,
        subtotalInr,
        userId: user?.id || null,
      });
      const totalInr = Math.max(0, subtotalInr - discountInr);

      const isMumbai = codRecord.isMumbai;
      const deliveryEtaText = isMumbai
        ? settings?.mumbaiDeliveryNote || "2 to 3 days in Mumbai (Shatrunjay Team / Porter)"
        : settings?.outsideMumbaiDeliveryNote || "5 to 7 working days outside Mumbai (Courier)";

      const orderNumber = `SG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      if (appliedCode) {
        await tx.discountCode.updateMany({
          where: { code: appliedCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cartLock.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: "CONVERTED", lockedUntil: null },
      });

      return tx.order.create({
        data: {
          orderNumber,
          userId: user?.id || null,
          cartId: cart.id,
          customerName: parsed.data.customerName.trim(),
          customerEmail: parsed.data.customerEmail.trim().toLowerCase(),
          customerPhone: parsed.data.customerPhone.trim(),
          shippingAddress: parsed.data.shippingAddress.trim(),
          city: parsed.data.city.trim(),
          state: parsed.data.state.trim(),
          pincode: parsed.data.pincode,
          isMumbai,
          deliveryEtaText,
          paymentMethod: "COD",
          paymentStatus: "COD_PENDING",
          orderStatus: "CONFIRMED",
          subtotalInr,
          discountInr,
          discountCodeUsed: appliedCode,
          totalInr,
          consentAccepted: true,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              sku: item.product.sku,
              productName: item.product.name,
              quantity: item.quantity,
              unitPriceInr: item.product.priceInr,
              lineTotalInr: item.product.priceInr * item.quantity,
            })),
          },
          statusHistory: {
            create: { status: "CONFIRMED", note: "Cash on Delivery order confirmed" },
          },
        },
      });
    });

    await sendEmail({
      to: order.customerEmail,
      subject: `COD Order Confirmed: ${order.orderNumber} — Shatrunjay Ghee`,
      html: `
        <h2>Thank you for your order, ${order.customerName}!</h2>
        <p>Your Cash on Delivery order <strong>${order.orderNumber}</strong> is confirmed.</p>
        <p><strong>Amount Payable on Delivery:</strong> ₹${order.totalInr}</p>
        <p><strong>Delivery Estimate:</strong> ${order.deliveryEtaText}</p>
      `,
    });

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to place COD order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
