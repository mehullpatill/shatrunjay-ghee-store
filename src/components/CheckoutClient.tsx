"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "./CartContext";
import { formatRupees } from "@/lib/pricing";

interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutClient({
  user,
  savedAddresses,
  checkoutNotes,
  razorpayKeyId,
}: {
  user: { name: string; email: string; phone: string | null; emailVerified: boolean } | null;
  savedAddresses: SavedAddress[];
  checkoutNotes: { mumbai: string; outsideMumbai: string };
  razorpayKeyId: string;
}) {
  const router = useRouter();
  const { items, subtotalPaise, clearCart } = useCart();

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const [recipientName, setRecipientName] = useState(savedAddresses[0]?.recipientName || user?.name || "");
  const [phone, setPhone] = useState(savedAddresses[0]?.phone || user?.phone || "");
  const [line1, setLine1] = useState(savedAddresses[0]?.line1 || "");
  const [line2, setLine2] = useState(savedAddresses[0]?.line2 || "");
  const [city, setCity] = useState(savedAddresses[0]?.city || "");
  const [state, setState] = useState(savedAddresses[0]?.state || "Maharashtra");
  const [pincode, setPincode] = useState(savedAddresses[0]?.pincode || "");

  const [pincodeInfo, setPincodeInfo] = useState<{
    checked: boolean;
    isMumbai: boolean;
    isCodAllowed: boolean;
    deliveryEtaText: string;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountPaise: number; kind: string } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (/^[1-9][0-9]{5}$/.test(pincode)) {
      fetch(`/api/pincode/check?pincode=${pincode}`)
        .then((r) => r.json())
        .then((d: { isMumbai?: boolean; isCodAllowed?: boolean; deliveryEtaText?: string }) => {
          if (d.deliveryEtaText) {
            setPincodeInfo({
              checked: true,
              isMumbai: Boolean(d.isMumbai),
              isCodAllowed: Boolean(d.isCodAllowed),
              deliveryEtaText: d.deliveryEtaText,
            });
            if (!d.isCodAllowed && paymentMethod === "COD") {
              setPaymentMethod("RAZORPAY");
            }
          }
        })
        .catch(() => {});
    } else {
      setPincodeInfo(null);
    }
  }, [pincode, paymentMethod]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold text-kadhai">Log in or Sign up to place your order</h1>
        <p className="mt-2 text-sm text-muted">
          Your cart items are saved. Please log in or create an account to complete checkout.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login?returnTo=/checkout" className="btn">Log In</Link>
          <Link href="/signup?returnTo=/checkout" className="btn-ghost">Sign Up</Link>
        </div>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold text-kadhai">Verify your email to continue</h1>
        <p className="mt-2 text-sm text-muted">
          Only verified accounts can place orders. Please click the verification link sent to <strong>{user.email}</strong>.
        </p>
        {resendMsg && <p className="mt-3 text-xs font-medium text-label">{resendMsg}</p>}
        <button
          type="button"
          disabled={resending}
          onClick={async () => {
            setResending(true);
            const r = await fetch("/api/auth/resend-verification", { method: "POST" });
            const d = (await r.json()) as { message?: string; error?: string };
            setResendMsg(d.message || d.error || "Sent.");
            setResending(false);
          }}
          className="btn mt-5"
        >
          {resending ? "Sending..." : "Resend Verification Email"}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-line bg-butter p-8 text-center">
        <h1 className="text-2xl font-bold text-kadhai">Your cart is empty</h1>
        <Link href="/shop" className="btn mt-4">Shop Pure Ghee</Link>
      </div>
    );
  }

  const applyDiscount = async () => {
    setDiscountError("");
    const res = await fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: discountCode, subtotalPaise }),
    });
    const d = (await res.json()) as { code?: string; discountPaise?: number; kind?: string; error?: string };
    if (!res.ok || !d.code) {
      setAppliedDiscount(null);
      setDiscountError(d.error || "Invalid code");
    } else {
      setAppliedDiscount({ code: d.code, discountPaise: d.discountPaise || 0, kind: d.kind || "PROMO" });
    }
  };

  const finalTotalPaise = Math.max(0, subtotalPaise - (appliedDiscount?.discountPaise ?? 0));

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!consentAccepted) {
      setError("Please accept the Terms of Service, Privacy Policy, Shipping and Refund Policy.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          address: { label: "Delivery", recipientName, phone, line1, line2, city, state, pincode },
          paymentMethod,
          discountCode: appliedDiscount?.code || null,
          consentAccepted: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        orderId?: string;
        orderNumber?: string;
        paymentMethod?: string;
        razorpayOrderId?: string;
        amountPaise?: number;
        currency?: string;
      };

      if (!res.ok || !data.orderId) {
        setError(data.error || "Failed to place order.");
        setSubmitting(false);
        return;
      }

      if (data.paymentMethod === "COD") {
        clearCart();
        router.push(`/account/orders/${data.orderId}?placed=1`);
        return;
      }

      if (!window.Razorpay || !data.razorpayOrderId) {
        setError("Razorpay payment script could not load. Please refresh and try again.");
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: data.amountPaise,
        currency: data.currency || "INR",
        name: "Shatrunjay Ghee",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: { name: recipientName, email: user.email, contact: phone },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            clearCart();
            router.push(`/account/orders/${data.orderId}?placed=1`);
          } else {
            setError("Payment verification failed. Please check your account orders.");
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      rzp.open();
    } catch {
      setError("Network error while placing order.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          {savedAddresses.length > 0 && (
            <div className="rounded-3xl border border-line bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Saved Addresses</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setRecipientName(addr.recipientName);
                      setPhone(addr.phone);
                      setLine1(addr.line1);
                      setLine2(addr.line2 || "");
                      setCity(addr.city);
                      setState(addr.state);
                      setPincode(addr.pincode);
                    }}
                    className="rounded-2xl border border-line px-3 py-2 text-left text-xs hover:border-maroon"
                  >
                    <p className="font-bold text-kadhai">{addr.label} — {addr.pincode}</p>
                    <p className="text-muted">{addr.line1}, {addr.city}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-line bg-white p-6 space-y-4">
            <h2 className="text-xl font-bold text-kadhai">Delivery Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Recipient Name *</span>
                <input type="text" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="field" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Phone *</span>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Address Line 1 *</span>
              <input type="text" required value={line1} onChange={(e) => setLine1(e.target.value)} className="field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Address Line 2 (optional)</span>
              <input type="text" value={line2} onChange={(e) => setLine2(e.target.value)} className="field" />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">City *</span>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="field" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">State *</span>
                <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="field" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Pincode *</span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[1-9][0-9]{5}"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  className="field"
                  placeholder="400004"
                />
              </label>
            </div>

            {pincodeInfo && (
              <div className="rounded-2xl bg-butter p-4 text-xs text-kadhai space-y-1">
                <p className="font-bold">Estimated Delivery: {pincodeInfo.deliveryEtaText}</p>
                <p>{pincodeInfo.isMumbai ? checkoutNotes.mumbai : checkoutNotes.outsideMumbai}</p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 space-y-3">
            <h2 className="text-xl font-bold text-kadhai">Payment Method</h2>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "RAZORPAY"}
                onChange={() => setPaymentMethod("RAZORPAY")}
              />
              <div>
                <p className="font-semibold text-kadhai">Pay Online via Razorpay</p>
                <p className="text-xs text-muted">UPI, Cards, Netbanking, Wallets — Available for all pincodes</p>
              </div>
            </label>
            {pincodeInfo?.isCodAllowed && (
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                <div>
                  <p className="font-semibold text-kadhai">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted">Available for your pincode ({pincode})</p>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="h-fit rounded-3xl border border-line bg-white p-6 space-y-4">
          <h2 className="text-xl font-bold text-kadhai">Order Summary</h2>
          <div className="space-y-2 border-b border-line pb-3 text-sm">
            {items.map((i) => (
              <div key={i.variantId} className="flex justify-between gap-2">
                <span>{i.productName} ({i.variantLabel}) × {i.quantity}</span>
                <span className="font-semibold">{formatRupees(i.pricePaise * i.quantity)}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-muted">Promo / Coupon / Referral Code</p>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="field flex-1"
              />
              <button type="button" onClick={applyDiscount} className="btn-ghost">
                Apply
              </button>
            </div>
            {discountError && <p className="mt-1 text-xs text-red-700">{discountError}</p>}
            {appliedDiscount && (
              <p className="mt-1 text-xs font-semibold text-label">
                Applied {appliedDiscount.code} (−{formatRupees(appliedDiscount.discountPaise)})
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-sm border-t border-line pt-3">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatRupees(subtotalPaise)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-label">
                <span>Discount ({appliedDiscount.code})</span>
                <span>−{formatRupees(appliedDiscount.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span className="text-label font-medium">Free</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-extrabold text-kadhai">
              <span>Total</span>
              <span>{formatRupees(finalTotalPaise)}</span>
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-ink/85">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms-of-service" className="underline text-maroon" target="_blank">Terms of Service</Link>,{" "}
              <Link href="/legal/privacy-policy" className="underline text-maroon" target="_blank">Privacy Policy</Link>,{" "}
              <Link href="/legal/shipping-policy" className="underline text-maroon" target="_blank">Shipping</Link> and{" "}
              <Link href="/legal/refund-policy" className="underline text-maroon" target="_blank">Refund Policy</Link>.
            </span>
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn w-full py-3.5 text-base">
            {submitting ? "Processing..." : paymentMethod === "COD" ? "Place COD Order" : "Pay & Place Order"}
          </button>
        </div>
      </form>
    </>
  );
}
