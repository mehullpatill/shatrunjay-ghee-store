import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { sanitizeRichHtml } from "@/lib/security";

describe("Payment Verification & Security Integration", () => {
  it("verifies valid Razorpay payment signature and rejects tampered signature", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "test_secret_key";
    process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.AUTH_SECRET = "a".repeat(32);
    process.env.AWS_REGION = "ap-south-1";
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";
    process.env.S3_BUCKET_NAME = "test-bucket";
    process.env.S3_PUBLIC_BASE_URL = "https://test-bucket.s3.ap-south-1.amazonaws.com";
    process.env.SES_FROM_EMAIL = "no-reply@shatrunjayghee.com";

    const orderId = "order_Test123";
    const paymentId = "pay_Test456";
    const sig = crypto
      .createHmac("sha256", "test_secret_key")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: sig,
      })
    ).toBe(true);

    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: "0".repeat(sig.length),
      })
    ).toBe(false);
  });

  it("verifies Razorpay raw-body webhook HMAC signature", () => {
    const rawBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });
    const sig = crypto.createHmac("sha256", "test_webhook_secret").update(rawBody).digest("hex");

    expect(verifyRazorpayWebhookSignature(rawBody, sig)).toBe(true);
    expect(verifyRazorpayWebhookSignature(rawBody, "invalid")).toBe(false);
    expect(verifyRazorpayWebhookSignature(rawBody, null)).toBe(false);
  });

  it("strips XSS script tags from rich HTML", () => {
    const clean = sanitizeRichHtml('<p>Pure <strong>A2 Ghee</strong></p><script>alert(1)</script>');
    expect(clean).toContain("<p>Pure <strong>A2 Ghee</strong></p>");
    expect(clean).not.toContain("<script>");
  });
});
