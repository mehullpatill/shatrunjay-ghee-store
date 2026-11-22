import { prisma } from "./prisma";
import { getSiteSettings } from "./cms";
import { computeDiscountPaise, type DiscountCandidate } from "./pricing";

export interface ResolvedDiscount {
  candidate: DiscountCandidate | null;
  discountPaise: number;
  totalPaise: number;
  error?: string;
}

export async function resolveAndValidateDiscount(params: {
  code: string | null | undefined;
  subtotalPaise: number;
  userId: string;
}): Promise<ResolvedDiscount> {
  const rawCode = params.code?.trim().toUpperCase();
  if (!rawCode) {
    return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise };
  }

  const now = new Date();

  // 1. Check PromoCode
  const promo = await prisma.promoCode.findUnique({ where: { code: rawCode } });
  if (promo && promo.active) {
    if (promo.startsAt && promo.startsAt > now) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Promo code is not active yet." };
    }
    if (promo.expiresAt && promo.expiresAt < now) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Promo code has expired." };
    }
    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Promo code usage limit reached." };
    }
    const candidate: DiscountCandidate = {
      kind: "PROMO",
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountPaise: promo.maxDiscountPaise,
      minOrderPaise: promo.minOrderPaise,
    };
    const res = computeDiscountPaise(params.subtotalPaise, candidate);
    return { candidate: res.error ? null : candidate, ...res };
  }

  // 2. Check CouponCode
  const coupon = await prisma.couponCode.findUnique({ where: { code: rawCode } });
  if (coupon && coupon.active) {
    if (coupon.startsAt && coupon.startsAt > now) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Coupon is not active yet." };
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Coupon has expired." };
    }
    if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Coupon usage limit reached." };
    }
    if (coupon.restrictedUserIds.length > 0 && !coupon.restrictedUserIds.includes(params.userId)) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "This coupon is not valid for your account." };
    }
    const userRedemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: params.userId },
    });
    if (userRedemptions >= coupon.perUserLimit) {
      return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "You have already used this coupon." };
    }
    const candidate: DiscountCandidate = {
      kind: "COUPON",
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountPaise: coupon.maxDiscountPaise,
      minOrderPaise: coupon.minOrderPaise,
    };
    const res = computeDiscountPaise(params.subtotalPaise, candidate);
    return { candidate: res.error ? null : candidate, ...res };
  }

  // 3. Check ReferralCode (only if referralEnabled feature flag is ON)
  const settings = await getSiteSettings();
  if (settings.referralEnabled) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: rawCode } });
    if (referrer) {
      if (referrer.id === params.userId) {
        return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "You cannot use your own referral code." };
      }
      const alreadyUsedReferral = await prisma.referralUsage.findUnique({ where: { refereeId: params.userId } });
      if (alreadyUsedReferral) {
        return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Referral discount can only be used on your first referral order." };
      }
      const candidate: DiscountCandidate = {
        kind: "REFERRAL",
        code: referrer.referralCode,
        discountType: settings.referralDiscountType,
        discountValue: settings.referralDiscountValue,
        maxDiscountPaise: settings.referralMaxDiscountPaise,
        minOrderPaise: 0,
      };
      const res = computeDiscountPaise(params.subtotalPaise, candidate);
      return { candidate: res.error ? null : candidate, ...res };
    }
  }

  return { candidate: null, discountPaise: 0, totalPaise: params.subtotalPaise, error: "Invalid or expired code." };
}
