import { describe, expect, it } from "vitest";
import {
  computeDiscountPaise,
  formatRupees,
  getDeliveryEta,
  MUMBAI_ETA_TEXT,
  OUTSIDE_MUMBAI_ETA_TEXT,
  validatePincodeFormat,
} from "@/lib/pricing";

describe("Pricing & Pincode Logic", () => {
  it("formats paise to INR rupees", () => {
    expect(formatRupees(100000)).toContain("1,000");
    expect(formatRupees(51000)).toContain("510");
  });

  it("returns Mumbai vs Outside Mumbai ETA", () => {
    expect(getDeliveryEta(true)).toBe(MUMBAI_ETA_TEXT);
    expect(getDeliveryEta(false)).toBe(OUTSIDE_MUMBAI_ETA_TEXT);
  });

  it("validates Indian 6-digit pincodes", () => {
    expect(validatePincodeFormat("400004")).toBe(true);
    expect(validatePincodeFormat("012345")).toBe(false);
    expect(validatePincodeFormat("40004")).toBe(false);
    expect(validatePincodeFormat("40000A")).toBe(false);
  });

  it("computes fixed discount without exceeding subtotal", () => {
    const res = computeDiscountPaise(50000, {
      kind: "COUPON",
      code: "FLAT100",
      discountType: "FIXED",
      discountValue: 10000,
    });
    expect(res.discountPaise).toBe(10000);
    expect(res.totalPaise).toBe(40000);

    const capped = computeDiscountPaise(5000, {
      kind: "COUPON",
      code: "FLAT100",
      discountType: "FIXED",
      discountValue: 10000,
    });
    expect(capped.discountPaise).toBe(5000);
    expect(capped.totalPaise).toBe(0);
  });

  it("computes percentage discount with optional max cap and min order", () => {
    const res = computeDiscountPaise(200000, {
      kind: "PROMO",
      code: "FESTIVE10",
      discountType: "PERCENT",
      discountValue: 10,
      maxDiscountPaise: 15000,
      minOrderPaise: 100000,
    });
    expect(res.discountPaise).toBe(15000);
    expect(res.totalPaise).toBe(185000);

    const belowMin = computeDiscountPaise(50000, {
      kind: "PROMO",
      code: "FESTIVE10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderPaise: 100000,
    });
    expect(belowMin.error).toBeTruthy();
    expect(belowMin.discountPaise).toBe(0);
  });
});
