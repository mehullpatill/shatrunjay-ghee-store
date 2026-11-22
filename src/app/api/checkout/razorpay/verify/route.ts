import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { lockProductRow } from "@/lib/cart-engine";
import { sendEmail } from "@/lib/email";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = verifySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    if (!verifyRazorpayPaymentSignature({
      razorpayOrderId: parsed.data.razorpay_order_id,
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      razorpaySignature: parsed.data.razorpay_signature,
    })) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE "razorpayOrderId" = ${parsed.data.razorpay_order_id} FOR UPDATE`;
      const existing = await tx.order.findUnique({
        where: { razorpayOrderId: parsed.data.razorpay_order_id },
        include: { items: { orderBy: { productId: "asc" } } },
      });
      if (!existing) throw new Error("Order not found");
      if (existing.paymentStatus === "PAID") return { order: existing, alreadyPaid: true };

      for (const item of existing.items) {
        await lockProductRow(tx, item.productId);
        const prod = await tx.product.findUnique({ where: { id: item.productId }, select: { stockQty: true } });
        if (!prod || prod.stockQty < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}`);
        }
        await tx.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.quantity } } });
      }
      if (existing.discountCodeUsed) {
        await tx.discountCode.updateMany({ where: { code: existing.discountCodeUsed }, data: { usedCount: { increment: 1 } } });
      }

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          razorpayPaymentId: parsed.data.razorpay_payment_id,
          razorpaySignature: parsed.data.razorpay_signature,
          statusHistory: { create: { status: "CONFIRMED", note: `Razorpay payment verified (${parsed.data.razorpay_payment_id})` } },
        },
      });
      return { order: updated, alreadyPaid: false };
    });

    if (!result.alreadyPaid) {
      await sendEmail({
        to: result.order.customerEmail,
        subject: `Order Confirmed: ${result.order.orderNumber} — Shatrunjay Ghee`,
        html: `<h2>Thank you, ${result.order.customerName}!</h2><p>Your order <strong>${result.order.orderNumber}</strong> (₹${result.order.totalInr}) is confirmed.</p><p>${result.order.deliveryEtaText}</p>`,
      });
    }

    return NextResponse.json({ ok: true, order_number: result.order.orderNumber });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Verification failed" }, { status: 500 });
  }
}
