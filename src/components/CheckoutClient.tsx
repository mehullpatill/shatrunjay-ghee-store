"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "./CartContext";
import { formatRupees } from "@/lib/pricing";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
export interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressFormData {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/* ------------------------------------------------------------------ */
/*  Inline address form (add / edit inside checkout)                   */
/* ------------------------------------------------------------------ */
function AddressFormInline({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: AddressFormData;
  onSave: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState<AddressFormData>(initial);
  const set = (k: keyof AddressFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="mt-4 space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Label *</span>
          <input type="text" required maxLength={40} value={form.label} onChange={set("label")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Recipient Name *</span>
          <input type="text" required maxLength={100} value={form.recipientName} onChange={set("recipientName")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Phone *</span>
          <input type="tel" required minLength={10} maxLength={15} value={form.phone} onChange={set("phone")} className="field" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Address Line 1 *</span>
        <input type="text" required maxLength={200} value={form.line1} onChange={set("line1")} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Address Line 2 (optional)</span>
        <input type="text" maxLength={200} value={form.line2} onChange={set("line2")} className="field" />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">City *</span>
          <input type="text" required maxLength={80} value={form.city} onChange={set("city")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">State *</span>
          <input type="text" required maxLength={80} value={form.state} onChange={set("state")} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Pincode *</span>
          <input
            type="text"
            required
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "") }))}
            className="field"
            placeholder="400004"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} className="accent-maroon" />
        <span>Save as default address</span>
      </label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="btn text-sm px-4 py-2">
          {saving ? "Saving…" : "Save & Use This Address"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost text-sm px-4 py-2">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main CheckoutClient                                                 */
/* ------------------------------------------------------------------ */
export default function CheckoutClient({
  user,
  savedAddresses: initialSavedAddresses,
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

  /* ---- resend verification ---- */
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  /* ---- saved addresses (can grow during checkout session) ---- */
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(initialSavedAddresses);

  /* ---- selected address id ("new" means manually filling a new one) ---- */
  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    defaultAddr ? defaultAddr.id : "new"
  );

  /* ---- inline edit/add panel ---- */
  type Panel = "none" | "add" | { editId: string };
  const [panel, setPanel] = useState<Panel>("none");
  const [panelSaving, setPanelSaving] = useState(false);
  const [panelError, setPanelError] = useState("");

  /* ---- delivery fields (driven by selectedAddressId) ---- */
  const [recipientName, setRecipientName] = useState(defaultAddr?.recipientName ?? user?.name ?? "");
  const [phone, setPhone] = useState(defaultAddr?.phone ?? user?.phone ?? "");
  const [line1, setLine1] = useState(defaultAddr?.line1 ?? "");
  const [line2, setLine2] = useState(defaultAddr?.line2 ?? "");
  const [city, setCity] = useState(defaultAddr?.city ?? "");
  const [state, setState] = useState(defaultAddr?.state ?? "Maharashtra");
  const [pincode, setPincode] = useState(defaultAddr?.pincode ?? "");

  /* ---- pincode check ---- */
  const [pincodeInfo, setPincodeInfo] = useState<{
    checked: boolean;
    isServiceable: boolean;
    isMumbai: boolean;
    isCodAllowed: boolean;
    deliveryEtaText: string;
  } | null>(null);

  /* ---- payment / discount / order ---- */
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountPaise: number; kind: string } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---- fill form fields when address selection changes ---- */
  useEffect(() => {
    if (selectedAddressId === "new") return; // keep what user typed
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return;
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 ?? "");
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId]);

  /* ---- pincode serviceability check ---- */
  useEffect(() => {
    if (/^[1-9][0-9]{5}$/.test(pincode)) {
      fetch(`/api/pincode/check?pincode=${pincode}`)
        .then((r) => r.json())
        .then((d: { isServiceable?: boolean; isMumbai?: boolean; isCodAllowed?: boolean; deliveryEtaText?: string }) => {
          if (d.isServiceable && d.deliveryEtaText) {
            setPincodeInfo({
              checked: true,
              isServiceable: true,
              isMumbai: Boolean(d.isMumbai),
              isCodAllowed: Boolean(d.isCodAllowed),
              deliveryEtaText: d.deliveryEtaText,
            });
            if (!d.isCodAllowed && paymentMethod === "COD") setPaymentMethod("RAZORPAY");
          } else {
            setPincodeInfo({ checked: true, isServiceable: false, isMumbai: false, isCodAllowed: false, deliveryEtaText: "" });
          }
        })
        .catch(() =>
          setPincodeInfo({ checked: true, isServiceable: false, isMumbai: false, isCodAllowed: false, deliveryEtaText: "" })
        );
    } else {
      setPincodeInfo(null);
    }
  }, [pincode, paymentMethod]);

  /* ---- reload saved addresses from API ---- */
  const refreshSavedAddresses = async () => {
    const res = await fetch("/api/account/addresses");
    if (res.ok) {
      const data = (await res.json()) as { addresses: SavedAddress[] };
      setSavedAddresses(data.addresses);
    }
  };

  /* ---- panel save handler ---- */
  const handlePanelSave = async (formData: { label: string; recipientName: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; isDefault: boolean }) => {
    setPanelSaving(true);
    setPanelError("");

    const isEditing = typeof panel === "object" && "editId" in panel;
    const url = isEditing
      ? `/api/account/addresses?id=${(panel as { editId: string }).editId}`
      : "/api/account/addresses";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, line2: formData.line2 || null }),
    });
    const json = (await res.json()) as { address?: SavedAddress; error?: string };

    if (!res.ok) {
      setPanelError(json.error || "Failed to save address.");
      setPanelSaving(false);
      return;
    }

    // Refresh list and auto-select the new/edited address
    await refreshSavedAddresses();
    if (json.address) {
      setSelectedAddressId(json.address.id);
    }
    setPanel("none");
    setPanelSaving(false);
  };

  /* ---- discount ---- */
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

  /* ---- place order ---- */
  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!consentAccepted) {
      setError("Please accept the Terms of Service, Privacy Policy, Shipping and Refund Policy.");
      return;
    }
    if (paymentMethod === "RAZORPAY" && !window.Razorpay) {
      setError("Payment gateway is still loading. Please wait a moment and try again.");
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

      if (!res.ok || (data.paymentMethod === "COD" && !data.orderId) || (data.paymentMethod === "RAZORPAY" && !data.razorpayOrderId)) {
        setError(data.error || "Failed to prepare checkout.");
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
        prefill: { name: recipientName, email: user?.email, contact: phone },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = (await verifyRes.json()) as { orderId?: string; error?: string };
          if (verifyRes.ok && verifyData.orderId) {
            clearCart();
            router.push(`/account/orders/${verifyData.orderId}?placed=1`);
          } else {
            setError(verifyData.error || "Payment verification failed. Please contact support if money was deducted.");
            setSubmitting(false);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      rzp.open();
    } catch {
      setError("Network error while placing order.");
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Guards                                                            */
  /* ---------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */
  const editingAddr = typeof panel === "object" && "editId" in panel
    ? savedAddresses.find((a) => a.id === (panel as { editId: string }).editId)
    : null;

  const panelInitial = panel === "add"
    ? { label: "Home", recipientName: user.name, phone: user.phone ?? "", line1: "", line2: "", city: "", state: "Maharashtra", pincode: "", isDefault: false }
    : editingAddr
    ? { ...editingAddr, line2: editingAddr.line2 ?? "" }
    : { label: "Home", recipientName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">

          {/* ---- Saved address picker ---- */}
          <div className="rounded-3xl border border-line bg-white p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-kadhai">Delivery Address</h2>
              {panel === "none" && savedAddresses.length < 10 && (
                <button
                  type="button"
                  onClick={() => { setPanel("add"); setPanelError(""); }}
                  className="text-xs font-semibold text-maroon hover:underline"
                >
                  + Add New
                </button>
              )}
            </div>

            {/* Saved address radio cards */}
            {savedAddresses.length > 0 && panel === "none" && (
              <div className="space-y-2">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                      selectedAddressId === addr.id
                        ? "border-maroon bg-maroon/5"
                        : "border-line hover:border-maroon/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      className="mt-1 accent-maroon"
                      checked={selectedAddressId === addr.id}
                      onChange={() => { setSelectedAddressId(addr.id); setPanel("none"); }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-kadhai">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="rounded-full bg-maroon/10 px-2 py-0.5 text-[10px] font-bold text-maroon">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-ink mt-0.5">{addr.recipientName} · {addr.phone}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                      {selectedAddressId === addr.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setPanel({ editId: addr.id });
                            setPanelError("");
                          }}
                          className="mt-1.5 text-xs font-semibold text-maroon hover:underline"
                        >
                          Edit this address
                        </button>
                      )}
                    </div>
                  </label>
                ))}

                {/* Option to enter a one-time address (not saved) */}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${
                    selectedAddressId === "new"
                      ? "border-maroon bg-maroon/5"
                      : "border-line hover:border-maroon/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedAddress"
                    className="accent-maroon"
                    checked={selectedAddressId === "new"}
                    onChange={() => { setSelectedAddressId("new"); setPanel("none"); }}
                  />
                  <span className="text-sm font-medium text-kadhai">Use a different address</span>
                </label>
              </div>
            )}

            {/* Inline add / edit panel */}
            {panel !== "none" && (
              <AddressFormInline
                initial={panelInitial}
                onSave={handlePanelSave}
                onCancel={() => { setPanel("none"); setPanelError(""); }}
                saving={panelSaving}
                error={panelError}
              />
            )}

            {/* Manual address fields — shown when "new" is selected or no saved addresses */}
            {panel === "none" && (selectedAddressId === "new" || savedAddresses.length === 0) && (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-muted font-medium">
                  {savedAddresses.length === 0
                    ? "Enter your delivery details below."
                    : "Fill in a one-time delivery address (it won't be saved)."}
                </p>
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
              </div>
            )}

            {/* Pincode info banners */}
            {panel === "none" && pincodeInfo?.isServiceable && (
              <div className="rounded-2xl bg-butter p-4 text-xs text-kadhai space-y-1">
                <p className="font-bold">Estimated Delivery: {pincodeInfo.deliveryEtaText}</p>
                <p>{pincodeInfo.isMumbai ? checkoutNotes.mumbai : checkoutNotes.outsideMumbai}</p>
              </div>
            )}
            {panel === "none" && pincodeInfo && !pincodeInfo.isServiceable && (
              <p className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-800">
                This pincode is not currently serviceable. Please check the pincode or contact us for help.
              </p>
            )}
          </div>

          {/* ---- Payment method ---- */}
          <div className="rounded-3xl border border-line bg-white p-6 space-y-3">
            <h2 className="text-xl font-bold text-kadhai">Payment Method</h2>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4">
              <input type="radio" name="paymentMethod" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} />
              <div>
                <p className="font-semibold text-kadhai">Pay Online via Razorpay</p>
                <p className="text-xs text-muted">UPI, Cards, Netbanking, Wallets — Available for serviceable pincodes</p>
              </div>
            </label>
            {pincodeInfo?.isServiceable && pincodeInfo.isCodAllowed && (
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4">
                <input type="radio" name="paymentMethod" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                <div>
                  <p className="font-semibold text-kadhai">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted">Available for your pincode ({pincode})</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* ---- Order Summary ---- */}
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
              <button type="button" onClick={applyDiscount} className="btn-ghost">Apply</button>
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
