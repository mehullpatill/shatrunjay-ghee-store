import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireVerifiedCustomerOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchRazorpayPayment, refundRazorpayPayment, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { assertSameOrigin } from "@/lib/security";
import { emailService } from "@/lib/ses";

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

type IntentPayload = {
  userId: string;
  orderNumber: string;
  address: { label: string; recipientName: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string };
  isMumbai: boolean;
  deliveryEtaText: string;
  policyVersion: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingFeePaise: number;
  totalPaise: number;
  appliedCode: string | null;
  discountKind: string | null;
  discountCandidate: { kind: string; code: string } | null;
  items: Array<{
    productId: string;
    variantId: string;
    productName: string;
    variantLabel: string;
    sku: string | null;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
  }>;
  state: string;
  orderId?: string;
};

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let user;
  try {
    user = await requireVerifiedCustomerOrAdmin();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
  const eventKey = `checkout:${razorpayOrderId}`;
  const intent = await prisma.paymentWebhookEvent.findUnique({ where: { providerEventId: eventKey } });
  if (!intent || intent.eventType === "CHECKOUT_INTENT_FAILED") {
    return NextResponse.json({ error: "Checkout session not found or expired. Please start checkout again." }, { status: 404 });
  }
  const payload = intent.payload as unknown as IntentPayload;
  if (payload.userId !== user.id) return NextResponse.json({ error: "Checkout session mismatch" }, { status: 403 });
  if (intent.eventType === "CHECKOUT_INTENT_COMPLETED" && payload.orderId) {
    return NextResponse.json({ ok: true, orderId: payload.orderId, orderNumber: payload.orderNumber });
  }

  const validSig = verifyRazorpayPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!validSig) return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });

  let payment;
  try {
    payment = await fetchRazorpayPayment(razorpayPaymentId);
  } catch {
    return NextResponse.json({ error: "Could not confirm payment with Razorpay. Please retry." }, { status: 502 });
  }
  if (payment.orderId !== razorpayOrderId || payment.amount !== payload.totalPaise || payment.currency !== "INR") {
    return NextResponse.json({ error: "Payment details do not match this checkout." }, { status: 400 });
  }
  if (payment.status !== "captured") {
    return NextResponse.json({ error: "Razorpay has not confirmed a captured payment yet. Please retry in a moment." }, { status: 409 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const currentIntent = await tx.paymentWebhookEvent.findUnique({ where: { providerEventId: eventKey } });
      if (!currentIntent) throw new Error("Checkout session not found.");
      const currentPayload = currentIntent.payload as unknown as IntentPayload;
      if (currentIntent.eventType === "CHECKOUT_INTENT_COMPLETED" && currentPayload.orderId) {
        return tx.order.findUniqueOrThrow({ where: { id: currentPayload.orderId } });
      }
      if (currentIntent.eventType !== "CHECKOUT_INTENT_PENDING") throw new Error("Checkout session is no longer active.");

      for (const item of payload.items) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, active: true, stockQty: { gte: item.quantity }, product: { is: { active: true } } },
          data: { stockQty: { decrement: item.quantity } },
        });
        if (updated.count !== 1) throw new Error(`Stock is no longer available for ${item.productName} (${item.variantLabel}).`);
      }

      if (payload.discountKind === "PROMO" && payload.appliedCode) {
        const promo = await tx.promoCode.findUnique({ where: { code: payload.appliedCode } });
        if (!promo || !promo.active || (promo.expiresAt && promo.expiresAt < new Date()) || (promo.startsAt && promo.startsAt > new Date())) {
          throw new Error("The discount code is no longer valid.");
        }
        const updated = await tx.promoCode.updateMany({
          where: { code: promo.code, active: true, ...(promo.usageLimit === null ? {} : { usageCount: { lt: promo.usageLimit } }) },
          data: { usageCount: { increment: 1 } },
        });
        if (updated.count !== 1) throw new Error("The promo code usage limit has been reached.");
      } else if (payload.discountKind === "COUPON" && payload.appliedCode) {
        const coupon = await tx.couponCode.findUnique({ where: { code: payload.appliedCode } });
        if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt < new Date()) || (coupon.startsAt && coupon.startsAt > new Date())) {
          throw new Error("The coupon is no longer valid.");
        }
        if (coupon.restrictedUserIds.length && !coupon.restrictedUserIds.includes(user.id)) throw new Error("This coupon is not valid for your account.");
        const usedByUser = await tx.couponRedemption.count({ where: { couponId: coupon.id, userId: user.id } });
        if (usedByUser >= coupon.perUserLimit) throw new Error("You have already used this coupon.");
        const updated = await tx.couponCode.updateMany({
          where: { code: coupon.code, active: true, ...(coupon.totalUsageLimit === null ? {} : { usageCount: { lt: coupon.totalUsageLimit } }) },
          data: { usageCount: { increment: 1 } },
        });
        if (updated.count !== 1) throw new Error("The coupon usage limit has been reached.");
      }

      const created = await tx.order.create({
        data: {
          orderNumber: payload.orderNumber,
          userId: user.id,
          status: "CONFIRMED",
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          subtotalPaise: payload.subtotalPaise,
          discountPaise: payload.discountPaise,
          shippingFeePaise: payload.shippingFeePaise,
          totalPaise: payload.totalPaise,
          appliedCode: payload.appliedCode,
          discountKind: payload.discountKind,
          shippingAddressSnapshot: payload.address,
          pincode: payload.address.pincode,
          isMumbai: payload.isMumbai,
          deliveryEtaText: payload.deliveryEtaText,
          consentAcceptedAt: new Date(),
          policyVersion: payload.policyVersion,
          razorpayOrderId,
          razorpayPaymentId,
          items: { create: payload.items },
          statusHistory: { create: { status: "CONFIRMED", note: `Razorpay payment captured (${razorpayPaymentId})`, changedByUserId: user.id } },
        },
      });

      if (payload.discountKind === "COUPON" && payload.appliedCode) {
        const coupon = await tx.couponCode.findUniqueOrThrow({ where: { code: payload.appliedCode } });
        await tx.couponRedemption.create({ data: { couponId: coupon.id, userId: user.id, orderId: created.id } });
      } else if (payload.discountKind === "REFERRAL" && payload.appliedCode) {
        const referrer = await tx.user.findUnique({ where: { referralCode: payload.appliedCode } });
        if (referrer) {
          await tx.referralUsage.create({ data: { referrerId: referrer.id, refereeId: user.id, orderId: created.id, discountPaise: payload.discountPaise } });
        }
      }

      await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
      await tx.paymentWebhookEvent.update({
        where: { providerEventId: eventKey },
        data: { eventType: "CHECKOUT_INTENT_COMPLETED", payload: { ...payload, state: "COMPLETED", orderId: created.id } },
      });
      return created;
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shatrunjay-ghee-store.vercel.app";
    try {
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
      } catch {
      // Email delivery must never trigger a refund after a paid order has been created.
    }
    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not complete the paid order.";
    try {
      await refundRazorpayPayment(razorpayPaymentId, payload.totalPaise);
      await prisma.paymentWebhookEvent.update({
        where: { providerEventId: eventKey },
        data: { eventType: "CHECKOUT_INTENT_FAILED", payload: { ...payload, state: "REFUNDED", failure: message, razorpayPaymentId } },
      });
      return NextResponse.json({ error: `${message} Your payment is being refunded. Please contact support if it is not returned shortly.` }, { status: 409 });
    } catch {
      return NextResponse.json({ error: `${message} Payment was received but automatic refund could not be confirmed. Contact support with payment ID ${razorpayPaymentId}.` }, { status: 500 });
    }
  }
}
