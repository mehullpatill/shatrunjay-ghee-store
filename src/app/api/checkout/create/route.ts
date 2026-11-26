import { NextResponse } from "next/server";
import { AuthError, requireVerifiedCustomerOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutCreateSchema } from "@/lib/validators";
import { assertSameOrigin, generateOrderNumber, getClientIp } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDeliveryEta } from "@/lib/pricing";
import { lookupIndianPostalPincode } from "@/lib/postal";
import { resolveAndValidateDiscount } from "@/lib/discount-server";
import { getSiteSettings } from "@/lib/cms";
import { createRazorpayOrder } from "@/lib/razorpay";
import { emailService } from "@/lib/ses";
import { getEnv } from "@/lib/env";
import { leadr } from "@/lib/leadr";

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

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`checkout:${user.id}:${ip}`, 15, 600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many checkout attempts. Please wait." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid checkout input" }, { status: 400 });
  }

  const { items, address, paymentMethod, discountCode } = parsed.data;

  if (getEnv().COMMERCE_BACKEND === "leadr") {
    const leadrPayload = {
      name: address.recipientName,
      phone: address.phone,
      email: user.email,
      address_line: [address.line1, address.line2].filter(Boolean).join(", "),
      area: address.city,
      pincode: address.pincode,
      city: address.city,
      state: address.state,
      payment_method: paymentMethod.toLowerCase(),
      promo_code: discountCode || null,
      items: items.map((item) => ({ product_id: item.variantId, quantity: item.quantity })),
    };
    const response = await leadr("/storefront/orders", {
      method: "POST",
      body: JSON.stringify(leadrPayload),
    }).catch(() => null);
    if (!response) return NextResponse.json({ error: "Shop is temporarily unavailable. Please try again." }, { status: 502 });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  }

  const settings = await getSiteSettings();

  // Re-validate pincode server-side (COD whitelist & Mumbai ETA)
  const pincodeRecord = await prisma.serviceablePincode.findUnique({
    where: { pincode: address.pincode },
  });
  let postal: Awaited<ReturnType<typeof lookupIndianPostalPincode>> | null = null;
  if (!pincodeRecord) {
    try {
      postal = await lookupIndianPostalPincode(address.pincode);
    } catch {
      return NextResponse.json({ error: "Pincode verification is temporarily unavailable. Please try again." }, { status: 503 });
    }
    if (!postal.valid) return NextResponse.json({ error: "This pincode is not valid according to India Post." }, { status: 400 });
  }
  const isMumbai = pincodeRecord?.isMumbai ?? false;
  const isCodAllowed = Boolean(pincodeRecord?.isCodAllowed);

  if (paymentMethod === "COD" && !isCodAllowed) {
    return NextResponse.json(
      { error: "Cash on Delivery is not available for this pincode. Please choose online payment via Razorpay." },
      { status: 400 }
    );
  }

  // Online checkout: create only a Razorpay gateway order here. Do not create a store order
  // or reserve stock/coupon usage until Razorpay confirms a captured payment.
  if (paymentMethod === "RAZORPAY") {
    const mergedItems = Array.from(
      items.reduce((map, item) => map.set(item.variantId, (map.get(item.variantId) || 0) + item.quantity), new Map<string, number>()),
      ([variantId, quantity]) => ({ variantId, quantity })
    );
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: mergedItems.map((i) => i.variantId) }, active: true },
      include: { product: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const orderItemsData = [];
    let subtotalPaise = 0;
    for (const item of mergedItems) {
      const variant = variantMap.get(item.variantId);
      if (!variant || !variant.product.active) {
        return NextResponse.json({ error: "One or more items in your cart are unavailable." }, { status: 400 });
      }
      if (variant.stockQty < item.quantity) {
        return NextResponse.json({ error: `Only ${variant.stockQty} units of ${variant.product.name} (${variant.label}) are available.` }, { status: 409 });
      }
      const lineTotalPaise = variant.pricePaise * item.quantity;
      subtotalPaise += lineTotalPaise;
      orderItemsData.push({
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.name,
        variantLabel: variant.label,
        sku: variant.sku,
        unitPricePaise: variant.pricePaise,
        quantity: item.quantity,
        lineTotalPaise,
      });
    }

    const discountRes = await resolveAndValidateDiscount({ code: discountCode, subtotalPaise, userId: user.id });
    if (discountCode && discountRes.error) {
      return NextResponse.json({ error: discountRes.error }, { status: 400 });
    }
    const totalPaise = discountRes.totalPaise;
    if (totalPaise <= 0) {
      return NextResponse.json({ error: "Online payment amount must be greater than zero." }, { status: 400 });
    }
    const orderNumber = generateOrderNumber();
    const rzpOrder = await createRazorpayOrder({
      amountPaise: totalPaise,
      receipt: orderNumber,
      notes: { userId: user.id, orderNumber },
    });
    const intentPayload = {
      userId: user.id,
      orderNumber,
      address,
      isMumbai,
      deliveryEtaText: getDeliveryEta(isMumbai),
      policyVersion: settings.policyVersion,
      subtotalPaise,
      discountPaise: discountRes.discountPaise,
      shippingFeePaise: 0,
      totalPaise,
      appliedCode: discountRes.candidate?.code ?? null,
      discountKind: discountRes.candidate?.kind ?? null,
      discountCandidate: discountRes.candidate ? { ...discountRes.candidate } : null,
      items: orderItemsData,
      state: "PENDING",
    };
    try {
      await prisma.paymentWebhookEvent.create({
        data: {
          providerEventId: `checkout:${rzpOrder.id}`,
          eventType: "CHECKOUT_INTENT_PENDING",
          payload: intentPayload,
        },
      });
    } catch {
      // If the intent cannot be persisted, do not leave a usable gateway order behind.
      throw new Error("Could not prepare checkout securely. Please try again.");
    }
    return NextResponse.json({
      paymentMethod: "RAZORPAY",
      razorpayOrderId: rzpOrder.id,
      amountPaise: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderNumber,
    });
  }

  // Recompute subtotal & check stock inside DB transaction
  const orderResult = await prisma.$transaction(async (tx) => {
    const variantIds = items.map((i) => i.variantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds }, active: true },
      include: { product: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotalPaise = 0;
    const orderItemsData: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantLabel: string;
      sku: string | null;
      unitPricePaise: number;
      quantity: number;
      lineTotalPaise: number;
    }> = [];

    for (const reqItem of items) {
      const v = variantMap.get(reqItem.variantId);
      if (!v || !v.product.active) {
        throw new Error("One or more items in your cart are unavailable.");
      }
      // Atomic conditional stock decrement to prevent overselling under concurrency
      const updated = await tx.productVariant.updateMany({
        where: { id: v.id, stockQty: { gte: reqItem.quantity } },
        data: { stockQty: { decrement: reqItem.quantity } },
      });
      if (updated.count === 0) {
        throw new Error(`Insufficient stock for ${v.product.name} (${v.label}).`);
      }

      const lineTotalPaise = v.pricePaise * reqItem.quantity;
      subtotalPaise += lineTotalPaise;
      orderItemsData.push({
        productId: v.productId,
        variantId: v.id,
        productName: v.product.name,
        variantLabel: v.label,
        sku: v.sku,
        unitPricePaise: v.pricePaise,
        quantity: reqItem.quantity,
        lineTotalPaise,
      });
    }

    const discountRes = await resolveAndValidateDiscount({
      code: discountCode,
      subtotalPaise,
      userId: user.id,
    });
    if (discountCode && discountRes.error) {
      throw new Error(discountRes.error);
    }

    const shippingFeePaise = 0; // Free home delivery
    const totalPaise = discountRes.totalPaise + shippingFeePaise;
    const orderNumber = generateOrderNumber();

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "PLACED",
        paymentMethod,
        paymentStatus: "PENDING",
        subtotalPaise,
        discountPaise: discountRes.discountPaise,
        shippingFeePaise,
        totalPaise,
        appliedCode: discountRes.candidate?.code ?? null,
        discountKind: discountRes.candidate?.kind ?? null,
        shippingAddressSnapshot: address,
        pincode: address.pincode,
        isMumbai,
        deliveryEtaText: getDeliveryEta(isMumbai),
        consentAcceptedAt: new Date(),
        policyVersion: settings.policyVersion,
        items: { create: orderItemsData },
        statusHistory: {
          create: {
            status: "PLACED",
            note: paymentMethod === "COD" ? "Order placed with Cash on Delivery" : "Awaiting Razorpay payment confirmation",
            changedByUserId: user.id,
          },
        },
      },
    });

    // Atomically record discount usage
    if (discountRes.candidate?.kind === "PROMO") {
      await tx.promoCode.update({
        where: { code: discountRes.candidate.code },
        data: { usageCount: { increment: 1 } },
      });
    } else if (discountRes.candidate?.kind === "COUPON") {
      const coupon = await tx.couponCode.update({
        where: { code: discountRes.candidate.code },
        data: { usageCount: { increment: 1 } },
      });
      await tx.couponRedemption.create({
        data: { couponId: coupon.id, userId: user.id, orderId: order.id },
      });
    } else if (discountRes.candidate?.kind === "REFERRAL") {
      const referrer = await tx.user.findUnique({ where: { referralCode: discountRes.candidate.code } });
      if (referrer) {
        await tx.referralUsage.create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
            orderId: order.id,
            discountPaise: discountRes.discountPaise,
          },
        });
      }
    }

    // Clear user's cart immediately for COD; for Razorpay, clear on verify
    if (paymentMethod === "COD") {
      await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    }

    return order;
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const accountUrl = `${siteUrl}/account/orders/${orderResult.id}`;

  if (paymentMethod === "COD") {
    await emailService.sendOrderPlacedEmail({
      toEmail: user.email,
      name: user.name,
      orderNumber: orderResult.orderNumber,
      totalPaise: orderResult.totalPaise,
      paymentMethod: "Cash on Delivery",
      deliveryEtaText: orderResult.deliveryEtaText,
      isMumbai: orderResult.isMumbai,
      accountUrl,
    });
    return NextResponse.json({
      orderId: orderResult.id,
      orderNumber: orderResult.orderNumber,
      paymentMethod: "COD",
    });
  }

  // Create Razorpay order server-side
  const rzpOrder = await createRazorpayOrder({
    amountPaise: orderResult.totalPaise,
    receipt: orderResult.orderNumber,
    notes: { orderId: orderResult.id, orderNumber: orderResult.orderNumber },
  });

  await prisma.order.update({
    where: { id: orderResult.id },
    data: { razorpayOrderId: rzpOrder.id },
  });

  return NextResponse.json({
    orderId: orderResult.id,
    orderNumber: orderResult.orderNumber,
    paymentMethod: "RAZORPAY",
    razorpayOrderId: rzpOrder.id,
    amountPaise: rzpOrder.amount,
    currency: rzpOrder.currency,
  });
}
