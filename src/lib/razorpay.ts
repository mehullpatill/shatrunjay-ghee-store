import crypto from "crypto";
import Razorpay from "razorpay";
import { getEnv, requireEnvValue } from "./env";
import { timingSafeEqualStr } from "./security";

let cachedRazorpay: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (cachedRazorpay) return cachedRazorpay;
  const env = getEnv();
  cachedRazorpay = new Razorpay({
    key_id: requireEnvValue(env.RAZORPAY_KEY_ID, "RAZORPAY_KEY_ID"),
    key_secret: requireEnvValue(env.RAZORPAY_KEY_SECRET, "RAZORPAY_KEY_SECRET"),
  });
  return cachedRazorpay;
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
}

export function verifyRazorpayPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const env = getEnv();
  const secret = requireEnvValue(env.RAZORPAY_KEY_SECRET, "RAZORPAY_KEY_SECRET");
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return timingSafeEqualStr(expected, params.razorpaySignature);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const env = getEnv();
  const secret = requireEnvValue(env.RAZORPAY_WEBHOOK_SECRET, "RAZORPAY_WEBHOOK_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqualStr(expected, signatureHeader);
}
