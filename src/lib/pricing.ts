import type { DiscountType } from "@prisma/client";

export const MUMBAI_ETA_TEXT = "2 to 3 days";
export const OUTSIDE_MUMBAI_ETA_TEXT = "5 to 7 working days";

// Business-approved Mumbai COD whitelist. Keep this list in code so a stale or
// misconfigured database row cannot make COD available elsewhere.
export const APPROVED_MUMBAI_COD_PINCODES = [
  "400001", "400002", "400003", "400004", "400005", "400006", "400007",
  "400008", "400009", "400010", "400011", "400012", "400018", "400020",
  "400021", "400023", "400026", "400027", "400032", "400036", "400038",
] as const;

const approvedMumbaiCodPincodes = new Set<string>(APPROVED_MUMBAI_COD_PINCODES);

export function isApprovedMumbaiCodPincode(pincode: string): boolean {
  return approvedMumbaiCodPincodes.has(pincode.trim());
}

export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

export function getDeliveryEta(isMumbai: boolean): string {
  return isMumbai ? MUMBAI_ETA_TEXT : OUTSIDE_MUMBAI_ETA_TEXT;
}

export interface DiscountCandidate {
  kind: "PROMO" | "COUPON" | "REFERRAL";
  code: string;
  discountType: DiscountType;
  discountValue: number; // paise if FIXED, integer 1..100 if PERCENT
  maxDiscountPaise?: number | null;
  minOrderPaise?: number;
}

/**
 * Pure server-side discount computation.
 * Stacking rule: maximum one discount code (Promo, Coupon, or Referral) per order.
 */
export function computeDiscountPaise(
  subtotalPaise: number,
  candidate: DiscountCandidate | null
): { discountPaise: number; totalPaise: number; error?: string } {
  if (!candidate || subtotalPaise <= 0) {
    return { discountPaise: 0, totalPaise: Math.max(0, subtotalPaise) };
  }

  const minOrder = candidate.minOrderPaise ?? 0;
  if (subtotalPaise < minOrder) {
    return {
      discountPaise: 0,
      totalPaise: subtotalPaise,
      error: `Minimum order of ${formatRupees(minOrder)} required for code ${candidate.code}.`,
    };
  }

  let discount = 0;
  if (candidate.discountType === "FIXED") {
    discount = candidate.discountValue;
  } else {
    const pct = Math.min(100, Math.max(0, candidate.discountValue));
    discount = Math.floor((subtotalPaise * pct) / 100);
    if (candidate.maxDiscountPaise && candidate.maxDiscountPaise > 0) {
      discount = Math.min(discount, candidate.maxDiscountPaise);
    }
  }

  discount = Math.min(discount, subtotalPaise);
  return {
    discountPaise: discount,
    totalPaise: subtotalPaise - discount,
  };
}

export function validatePincodeFormat(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}
