import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { computeDiscount, lockProductRow } from "@/lib/cart-engine";
import { getRazorpayClient } from "@/lib/razorpay";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ detail: "Cart is empty." }, { status: 400 });
    }

    const user = await getSessionUser();
    const settings = await prisma.siteSetting.findUnique({ where: { id: "default" } });
    const email = (body.email || user?.email || "").trim().toLowerCase();
    const phone = (body.phone || user?.phone || "").trim();
    const name = (body.name || user?.name || "").trim();
    const pincode = String(body.pincode || "").trim();

    if (!name || !phone || !email || !/^\d{6}$/.test(pincode) || !body.address_line) {
      return NextResponse.json({ detail: "Please fill all required delivery and contact details." }, { status: 400 });
    }

    // Logged-in customers skip OTP; guests verify OTP if otpRequired
    if (!user && settings?.otpRequired) {
      const otpCode = String(body.otp_code || "").trim();
      const otp = await prisma.otpCode.findFirst({
        where: { email, code: otpCode, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!otp) {
        return NextResponse.json({ detail: "Invalid or expired verification code." }, { status: 400 });
      }
      await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    }

    const paymentMethod = body.payment_method === "cod" ? "COD" : "RAZORPAY";
    const codRecord = await prisma.codPincode.findUnique({ where: { pincode } });
    if (paymentMethod === "COD" && (!codRecord || !codRecord.isActive)) {
      return NextResponse.json(
        { detail: "Cash on Delivery is not available for this pincode. Please pay online via Razorpay." },
        { status: 400 }
      );
    }

    const isMumbai = codRecord ? codRecord.isMumbai : pincode.startsWith("400");
    const deliveryEtaText = isMumbai
      ? "Deliveries in Mumbai will be done by Shatrunjay Team or Porter in 2 to 3 days."
      : "Deliveries outside Mumbai will be done by courier in 5 to 7 working days.";

    const reqItems = [...body.items].sort((a, b) => String(a.product_id).localeCompare(String(b.product_id)));

    const orderResult = await prisma.$transaction(async (tx) => {
      let subtotalInr = 0;
      const lineItems: Array<{ productId: string; sku: string; productName: string; quantity: number; unitPriceInr: number; lineTotalInr: number }> = [];

      for (const reqItem of reqItems) {
        const qty = Number(reqItem.quantity);
        if (!Number.isInteger(qty) || qty <= 0) throw new Error("Invalid quantity.");
        await lockProductRow(tx, reqItem.product_id);
        const product = await tx.product.findUnique({ where: { id: reqItem.product_id } });
        if (!product || !product.isActive || !product.inStock || product.stockQty < qty) {
          throw new Error(`Insufficient stock for ${product?.name || "product"}.`);
        }
        const unitPriceInr = Math.round(product.pricePaise / 100);
        if (unitPriceInr <= 0) throw new Error(`Price not configured for ${product.name}.`);
        subtotalInr += unitPriceInr * qty;
        lineItems.push({
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          quantity: qty,
          unitPriceInr,
          lineTotalInr: unitPriceInr * qty,
        });
      }

      const { discountInr, appliedCode, reason } = await computeDiscount({
        code: body.promo_code,
        subtotalInr,
        userId: user?.id || null,
      });
      if (body.promo_code && reason) throw new Error(reason);

      const totalInr = Math.max(0, subtotalInr - discountInr);
      const orderNumber = `WEB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      if (paymentMethod === "COD") {
        for (const item of lineItems) {
          await tx.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.quantity } } });
        }
        if (appliedCode) {
          await tx.discountCode.updateMany({ where: { code: appliedCode }, data: { usedCount: { increment: 1 } } });
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id || null,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: body.address_line.trim(),
          area: body.area?.trim() || null,
          city: body.city?.trim() || "Mumbai",
          state: body.state?.trim() || "Maharashtra",
          pincode,
          isMumbai,
          deliveryEtaText,
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "COD_PENDING" : "PENDING",
          orderStatus: paymentMethod === "COD" ? "CONFIRMED" : "PLACED",
          subtotalInr,
          discountInr,
          discountCodeUsed: appliedCode,
          totalInr,
          items: { create: lineItems },
          statusHistory: {
            create: {
              status: paymentMethod === "COD" ? "CONFIRMED" : "PLACED",
              note: paymentMethod === "COD" ? "COD order confirmed" : "Awaiting Razorpay payment",
            },
          },
        },
      });

      return order;
    });

    if (paymentMethod === "COD") {
      await sendEmail({
        to: orderResult.customerEmail,
        subject: `Order Confirmed: ${orderResult.orderNumber} — Shatrunjay Ghee`,
        html: `<h2>Thank you, ${orderResult.customerName}!</h2><p>Your COD order <strong>${orderResult.orderNumber}</strong> (₹${orderResult.totalInr}) is confirmed.</p><p>${deliveryEtaText}</p>`,
      });
      return NextResponse.json({ order_number: orderResult.orderNumber });
    }

    const rzp = getRazorpayClient();
    const rzpOrder = await rzp.orders.create({
      amount: Math.max(100, orderResult.totalInr * 100),
      currency: "INR",
      receipt: orderResult.orderNumber,
    });
    await prisma.order.update({ where: { id: orderResult.id }, data: { razorpayOrderId: rzpOrder.id } });

    return NextResponse.json({
      order_number: orderResult.orderNumber,
      razorpay: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        orderId: rzpOrder.id,
        amount: Math.max(100, orderResult.totalInr * 100),
        currency: "INR",
        name: "Shatrunjay Ghee",
        description: `Order ${orderResult.orderNumber}`,
        prefill: { name, email, contact: phone },
      },
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ detail }, { status: 400 });
  }
}
