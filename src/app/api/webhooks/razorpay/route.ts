import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { emailService } from "@/lib/ses";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    id?: string;
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event || "unknown";
  const paymentEntity = event.payload?.payment?.entity;
  const providerEventId =
    req.headers.get("x-razorpay-event-id") ||
    event.id ||
    `${eventType}:${paymentEntity?.id || "none"}`;

  // Idempotency check
  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { providerEventId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.paymentWebhookEvent.create({
    data: {
      providerEventId,
      eventType,
      payload: event as unknown as Prisma.InputJsonValue,
    },
  });

  const razorpayOrderId = paymentEntity?.order_id;
  const razorpayPaymentId = paymentEntity?.id;

  if (razorpayOrderId) {
    const order = await prisma.order.findUnique({
      where: { razorpayOrderId },
      include: { user: true },
    });

    if (order) {
      if (eventType === "payment.captured" && order.paymentStatus !== "PAID") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
            },
          }),
          prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: "CONFIRMED",
              note: `Payment captured via Razorpay webhook (${razorpayPaymentId || "n/a"})`,
            },
          }),
          prisma.cartItem.deleteMany({ where: { cart: { userId: order.userId } } }),
        ]);

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await emailService.sendOrderPlacedEmail({
          toEmail: order.user.email,
          name: order.user.name,
          orderNumber: order.orderNumber,
          totalPaise: order.totalPaise,
          paymentMethod: "Razorpay (Paid)",
          deliveryEtaText: order.deliveryEtaText,
          isMumbai: order.isMumbai,
          accountUrl: `${siteUrl}/account/orders/${order.id}`,
        });
      } else if (eventType === "payment.failed" && order.paymentStatus === "PENDING") {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
