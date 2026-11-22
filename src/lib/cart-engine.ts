import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export const CART_LOCK_MINUTES = 15;

export async function releaseExpiredLocks(tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const now = new Date();
  const expiredLocks = await tx.cartLock.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true, cartId: true },
  });

  if (expiredLocks.length > 0) {
    await tx.cartLock.deleteMany({ where: { expiresAt: { lt: now } } });
    const cartIds = Array.from(new Set(expiredLocks.map((l) => l.cartId)));
    await tx.cart.updateMany({
      where: { id: { in: cartIds }, status: "LOCKED" },
      data: { status: "ACTIVE", lockedUntil: null },
    });
  }
}

export async function lockProductRow(tx: Prisma.TransactionClient, productId: string) {
  await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${productId} FOR UPDATE`;
}

export async function getAvailableStock(
  productId: string,
  excludeCartId?: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<number> {
  const now = new Date();
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { stockQty: true, isActive: true, inStock: true },
  });
  if (!product || !product.isActive || !product.inStock) return 0;

  const activeLocks = await tx.cartLock.aggregate({
    where: {
      productId,
      expiresAt: { gt: now },
      ...(excludeCartId ? { cartId: { not: excludeCartId } } : {}),
    },
    _sum: { quantity: true },
  });

  return Math.max(0, product.stockQty - (activeLocks._sum.quantity ?? 0));
}

export async function computeDiscount(params: {
  code: string | null | undefined;
  subtotalInr: number;
  userId?: string | null;
}) {
  if (!params.code || !params.code.trim()) {
    return { discountInr: 0, appliedCode: null, reason: null };
  }

  const normalized = params.code.trim().toUpperCase();
  const now = new Date();

  const discountRecord = await prisma.discountCode.findUnique({ where: { code: normalized } });

  if (discountRecord && discountRecord.isActive) {
    if (discountRecord.expiresAt && discountRecord.expiresAt < now) {
      return { discountInr: 0, appliedCode: null, reason: "This code has expired." };
    }
    if (discountRecord.usageLimit !== null && discountRecord.usedCount >= discountRecord.usageLimit) {
      return { discountInr: 0, appliedCode: null, reason: "This code has reached its usage limit." };
    }
    if (params.subtotalInr < discountRecord.minOrderInr) {
      return {
        discountInr: 0,
        appliedCode: null,
        reason: `Minimum order of ₹${discountRecord.minOrderInr} required for ${normalized}.`,
      };
    }

    let rawDiscount =
      discountRecord.discountType === "PERCENT"
        ? Math.floor((params.subtotalInr * discountRecord.value) / 100)
        : discountRecord.value;

    if (discountRecord.maxDiscountInr !== null) {
      rawDiscount = Math.min(rawDiscount, discountRecord.maxDiscountInr);
    }

    return { discountInr: Math.min(rawDiscount, params.subtotalInr), appliedCode: normalized, reason: null };
  }

  const settings = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (settings?.referralSystemEnabled) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: normalized }, select: { id: true } });
    if (referrer) {
      if (params.userId && referrer.id === params.userId) {
        return { discountInr: 0, appliedCode: null, reason: "You cannot use your own referral code." };
      }
      let rawDiscount =
        settings.referralDiscountType === "PERCENT"
          ? Math.floor((params.subtotalInr * settings.referralDiscountValue) / 100)
          : settings.referralDiscountValue;
      if (settings.referralMaxDiscountInr !== null) {
        rawDiscount = Math.min(rawDiscount, settings.referralMaxDiscountInr);
      }
      return { discountInr: Math.min(rawDiscount, params.subtotalInr), appliedCode: normalized, reason: null };
    }
  }

  return { discountInr: 0, appliedCode: null, reason: "Invalid or inactive code." };
}
