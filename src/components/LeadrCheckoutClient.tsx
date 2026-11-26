"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import type { LeadrSite } from "@/lib/leadr";
import type { CommerceProduct } from "@/lib/commerce";
import { formatRupees } from "@/lib/pricing";

export default function LeadrCheckoutClient({ site }: { site: LeadrSite; products: CommerceProduct[] }) {
  const router = useRouter();
  const { items, subtotalPaise, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState(site.cod_enabled ? "cod" : "razorpay");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  async function sendOtp() {
    setBusy(true); setError("");
    const response = await fetch("/api/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, email: email || null }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.detail || "We could not send the verification code."); else setCodeSent(true);
    setBusy(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    if (site.otp_required && !codeSent) { await sendOtp(); return; }
    const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: String(form.get("name") || ""), phone, email: email || null, address_line: String(form.get("address_line") || ""), area: String(form.get("area") || ""), pincode: String(form.get("pincode") || ""), city: String(form.get("city") || ""), state: String(form.get("state") || ""), payment_method: paymentMethod, promo_code: String(form.get("promo_code") || "") || null, otp_code: otp || null, items: items.map((item) => ({ product_id: item.variantId, quantity: item.quantity })),
    }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.detail || "Please check your details and try again."); setBusy(false); return; }
    clearCart();
    if (data.payment_url) window.location.assign(data.payment_url); else router.push(`/track?order=${encodeURIComponent(data.order_number || "")}&phone=${encodeURIComponent(phone)}`);
  }

  if (!items.length) return <p className="rounded-3xl bg-butter py-16 text-center text-muted">Your cart is empty.</p>;
  return <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_380px]">
    <div className="space-y-6">
      <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="mb-2 text-xl font-bold text-kadhai">Your details</legend>
        <label><span className="lbl">Full name</span><input name="name" required className="field" /></label>
        <label><span className="lbl">Phone (WhatsApp)</span><input name="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} className="field" /></label>
        <label className="sm:col-span-2"><span className="lbl">Email (optional)</span><input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" /></label>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="mb-2 text-xl font-bold text-kadhai">Delivery address</legend>
        <label className="sm:col-span-2"><span className="lbl">Flat, building, street</span><input name="address_line" required className="field" /></label>
        <label><span className="lbl">Area or locality</span><input name="area" className="field" /></label><label><span className="lbl">Pincode</span><input name="pincode" required pattern="[0-9]{6}" className="field" /></label>
        <label><span className="lbl">City</span><input name="city" defaultValue="Mumbai" className="field" /></label><label><span className="lbl">State</span><input name="state" defaultValue="Maharashtra" className="field" /></label>
      </fieldset>
      <fieldset><legend className="mb-3 text-xl font-bold text-kadhai">Payment</legend><div className="grid gap-3 sm:grid-cols-2">
        {site.cod_enabled && <label className={`rounded-2xl border p-4 ${paymentMethod === "cod" ? "border-kadhai bg-butter" : "border-line"}`}><input type="radio" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /> <span className="ml-2 font-semibold">Cash on delivery</span></label>}
        {site.online_payment_enabled && <label className={`rounded-2xl border p-4 ${paymentMethod === "razorpay" ? "border-kadhai bg-butter" : "border-line"}`}><input type="radio" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} /> <span className="ml-2 font-semibold">Pay online</span></label>}
      </div></fieldset>
    </div>
    <aside className="h-fit rounded-3xl bg-butter p-6 lg:sticky lg:top-24"><h2 className="text-xl font-bold text-kadhai">Your order</h2><ul className="mt-4 space-y-2 text-sm">{items.map((item) => <li key={item.variantId} className="flex justify-between gap-3"><span>{item.productName} × {item.quantity}</span><span>{formatRupees(item.pricePaise * item.quantity)}</span></li>)}</ul><label className="mt-5 block"><span className="lbl">Promo or referral code</span><input name="promo_code" className="field uppercase" /></label>{site.otp_required && <label className="mt-4 block"><span className="lbl">{codeSent ? "Verification code" : "Phone verification"}</span><input value={otp} onChange={(e) => setOtp(e.target.value)} disabled={!codeSent} required={codeSent} className="field" placeholder={codeSent ? "6-digit code" : "Click place order to send code"} /></label>}<div className="mt-5 flex justify-between border-t border-kadhai/10 pt-4 font-bold"><span>Total before delivery</span><span>{formatRupees(subtotalPaise + site.shipping_charge_paise)}</span></div>{error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button className="btn mt-5 w-full" disabled={busy}>{busy ? "Please wait…" : site.otp_required && !codeSent ? "Send code to confirm" : "Place order"}</button></aside>
  </form>;
}
