import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { lockProductRow } from "@/lib/cart-engine";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("x-razorpay-signature");

    if (!verifyRazorpayWebhookSignature(rawBody, sig)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const paymentEntity = event?.payload?.payment?.entity;
    const rzpOrderId = paymentEntity?.order_id as string | undefined;

    if (!rzpOrderId) return NextResponse.json({ ok: true });

    if (event.event === "payment.captured") {
      const capturedOrder = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Order" WHERE "razorpayOrderId" = ${rzpOrderId} FOR UPDATE`;

        const existing = await tx.order.findUnique({
          where: { razorpayOrderId: rzpOrderId },
          include: { items: { orderBy: { productId: "asc" } } },
        });
        if (!existing || existing.paymentStatus === "PAID") return null;

        for (const item of existing.items) {
          await lockProductRow(tx, item.productId);
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity } },
          });
        }

        if (existing.discountCodeUsed) {
          await tx.discountCode.updateMany({
            where: { code: existing.discountCodeUsed },
            data: { usedCount: { increment: 1 } },
          });
        }

        if (existing.cartId) {
          await tx.cartLock.deleteMany({ where: { cartId: existing.cartId } });
          await tx.cart.update({
            where: { id: existing.cartId },
            data: { status: "CONVERTED", lockedUntil: null },
          });
        }

        return tx.order.update({
          where: { id: existing.id },
          data: {
            paymentStatus: "PAID",
            orderStatus: "CONFIRMED",
            razorpayPaymentId: paymentEntity.id,
            statusHistory: {
              create: { status: "CONFIRMED", note: `Captured via webhook (${paymentEntity.id})` },
            },
          },
        });
      });

      if (capturedOrder) {
        await sendEmail({
          to: capturedOrder.customerEmail,
          subject: `Order Confirmed: ${capturedOrder.orderNumber} — Shatrunjay Ghee`,
          html: `
            <h2>Thank you for your order, ${capturedOrder.customerName}!</h2>
            <p>Your order <strong>${capturedOrder.orderNumber}</strong> is confirmed.</p>
            <p><strong>Total Paid:</strong> ₹${capturedOrder.totalInr}</p>
            <p><strong>Delivery Estimate:</strong> ${capturedOrder.deliveryEtaText}</p>
          `,
        });
      }
    } else if (event.event === "payment.failed") {
      await prisma.order.updateMany({
        where: { razorpayOrderId: rzpOrderId, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
