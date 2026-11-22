import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireVerifiedCustomerOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { assertSameOrigin } from "@/lib/security";
import { emailService } from "@/lib/ses";

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  let user;
  try {
    user = await requireVerifiedCustomerOrAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.razorpayOrderId !== razorpayOrderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  // Idempotent return if already paid
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  }

  const validSig = verifyRazorpayPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!validSig) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPaymentId,
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CONFIRMED",
        note: `Razorpay payment verified (${razorpayPaymentId})`,
        changedByUserId: user.id,
      },
    }),
    prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await emailService.sendOrderPlacedEmail({
    toEmail: user.email,
    name: user.name,
    orderNumber: order.orderNumber,
    totalPaise: order.totalPaise,
    paymentMethod: "Razorpay (Paid)",
    deliveryEtaText: order.deliveryEtaText,
    isMumbai: order.isMumbai,
    accountUrl: `${siteUrl}/account/orders/${order.id}`,
  });

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
}
