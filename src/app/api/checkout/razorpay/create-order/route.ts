import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE_NAME, getSessionUser } from "@/lib/auth";
import { computeDiscount, lockCartInventory } from "@/lib/cart-engine";
import { getRazorpayClient } from "@/lib/razorpay";

const createOrderSchema = z.object({
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
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid checkout details." },
        { status: 400 }
      );
    }

    const sessionToken = cookies().get(CART_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Cart session missing." }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionToken },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    if (cart.items.some((i) => i.product.priceInr <= 0)) {
      return NextResponse.json(
        { error: "One or more items do not have a valid price configured." },
        { status: 400 }
      );
    }

    const user = await getSessionUser();
    const lockResult = await lockCartInventory(cart.id);

    const subtotalInr = cart.items.reduce((sum, i) => sum + i.product.priceInr * i.quantity, 0);
    const { discountInr, appliedCode } = await computeDiscount({
      code: cart.appliedCode,
      subtotalInr,
      userId: user?.id || null,
    });
    const totalInr = subtotalInr - discountInr;
    if (totalInr < 1) {
      return NextResponse.json(
        { error: "Payable amount must be at least ₹1 for online payment." },
        { status: 400 }
      );
    }

    const [codRecord, settings] = await Promise.all([
      prisma.codPincode.findUnique({ where: { pincode: parsed.data.pincode } }),
      prisma.siteSetting.findUnique({ where: { id: "default" } }),
    ]);

    const isMumbai = codRecord ? codRecord.isMumbai : parsed.data.pincode.startsWith("400");
    const deliveryEtaText = isMumbai
      ? settings?.mumbaiDeliveryNote || "2 to 3 days in Mumbai (Shatrunjay Team / Porter)"
      : settings?.outsideMumbaiDeliveryNote || "5 to 7 working days outside Mumbai (Courier)";

    await prisma.order.updateMany({
      where: { cartId: cart.id, paymentMethod: "RAZORPAY", paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED", orderStatus: "CANCELLED" },
    });

    const orderNumber = `SG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const rzp = getRazorpayClient();
    const razorpayOrder = await rzp.orders.create({
      amount: totalInr * 100,
      currency: "INR",
      receipt: orderNumber,
      notes: {
        orderNumber,
        customerEmail: parsed.data.customerEmail,
      },
    });

    const order = await prisma.order.create({
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
        paymentMethod: "RAZORPAY",
        paymentStatus: "PENDING",
        orderStatus: "PLACED",
        subtotalInr,
        discountInr,
        discountCodeUsed: appliedCode,
        totalInr,
        razorpayOrderId: razorpayOrder.id,
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
          create: { status: "PLACED", note: "Awaiting Razorpay payment confirmation" },
        },
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amountPaise: totalInr * 100,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      lockedUntil: lockResult.lockedUntil,
    });
  } catch (err: unknown) {
    console.error("Razorpay create-order error:", err);
    const message = err instanceof Error ? err.message : "Failed to initialize payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
