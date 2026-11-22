import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { lockProductRow } from "@/lib/cart-engine";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!verifyRazorpayWebhookSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    const event = JSON.parse(rawBody);
    const rzpOrderId = event?.payload?.payment?.entity?.order_id as string | undefined;
    if (!rzpOrderId) return NextResponse.json({ ok: true });

    if (event.event === "payment.captured") {
      const captured = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Order" WHERE "razorpayOrderId" = ${rzpOrderId} FOR UPDATE`;
        const existing = await tx.order.findUnique({
          where: { razorpayOrderId: rzpOrderId },
          include: { items: { orderBy: { productId: "asc" } } },
        });
        if (!existing || existing.paymentStatus === "PAID") return null;

        for (const item of existing.items) {
          await lockProductRow(tx, item.productId);
          await tx.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.quantity } } });
        }
        if (existing.discountCodeUsed) {
          await tx.discountCode.updateMany({ where: { code: existing.discountCodeUsed }, data: { usedCount: { increment: 1 } } });
        }
        return tx.order.update({
          where: { id: existing.id },
          data: {
            paymentStatus: "PAID",
            orderStatus: "CONFIRMED",
            razorpayPaymentId: event.payload.payment.entity.id,
            statusHistory: { create: { status: "CONFIRMED", note: "Captured via Razorpay webhook" } },
          },
        });
      });

      if (captured) {
        await sendEmail({
          to: captured.customerEmail,
          subject: `Order Confirmed: ${captured.orderNumber} — Shatrunjay Ghee`,
          html: `<h2>Thank you, ${captured.customerName}!</h2><p>Your order <strong>${captured.orderNumber}</strong> (₹${captured.totalInr}) is confirmed.</p>`,
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
