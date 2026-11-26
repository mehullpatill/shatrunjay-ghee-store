"use client";
import { useState } from "react";
import { api, setCached, useApi } from "@/lib/adminApi";
import { ErrorLine, PageHeader, Skeleton, STATUS, toast } from "../ui";

type Msg = { enabled: boolean; text: string; template_id?: string | null };
type S = {
  cod_enabled: boolean; cod_min_amount_paise: number; cod_max_amount_paise: number; razorpay_enabled: boolean; upi_enabled: boolean;
  razorpay_connection_status: string; shipping_charge_paise: number; delivery_time_text: string; auto_confirm_orders: boolean;
  min_order_amount_paise: number; max_order_amount_paise: number; max_items_per_order: number; order_number_prefix: string;
  support_phone: string; handoff_number: string; status_messages: Record<string, Msg>; default_status_messages: Record<string, string>;
  referrals_enabled: boolean; referral_referee_discount_paise: number; referral_reward_paise: number; stock_from_salesmanagement: boolean;
};
// Rupee fields are edited as rupees and stored as paise; "" means 0, which Leadr reads as "no limit".
const MONEY = ["cod_min_amount_paise", "cod_max_amount_paise", "shipping_charge_paise", "min_order_amount_paise", "max_order_amount_paise", "referral_referee_discount_paise", "referral_reward_paise"] as const;
const MSG_ORDER = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "payment_pending", "payment_failed"];

const moneyOf = (s: S) => Object.fromEntries(MONEY.map((k) => [k, s[k] ? String(s[k] / 100) : ""]));

export default function Settings() {
  const { data, error } = useApi<S>("settings");
  const [version, setVersion] = useState(0);
  if (!data) return <div><PageHeader title="Settings" /><ErrorLine msg={error} /><div className="panel"><Skeleton /></div></div>;
  return <SettingsForm key={version} data={data} onDiscard={() => setVersion(version + 1)} />;
}

function SettingsForm({ data, onDiscard }: { data: S; onDiscard: () => void }) {
  const [f, setF] = useState(data);
  const [money, setMoney] = useState<Record<string, string>>(() => moneyOf(data));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof S>(k: K, v: S[K]) => setF({ ...f, [k]: v });
  const msg = (s: string): Msg => f.status_messages?.[s] ?? { enabled: true, text: "" };
  const dirty = JSON.stringify(f) !== JSON.stringify(data) || MONEY.some((k) => (money[k] ? Math.round(Number(money[k]) * 100) : 0) !== data[k]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const body = {
      cod_enabled: f.cod_enabled, upi_enabled: f.upi_enabled, razorpay_enabled: f.razorpay_enabled, delivery_time_text: f.delivery_time_text,
      auto_confirm_orders: f.auto_confirm_orders, max_items_per_order: Number(f.max_items_per_order) || 0, order_number_prefix: f.order_number_prefix.trim().toUpperCase(),
      support_phone: f.support_phone, handoff_number: f.handoff_number, status_messages: f.status_messages, referrals_enabled: f.referrals_enabled,
      stock_from_salesmanagement: f.stock_from_salesmanagement,
      ...Object.fromEntries(MONEY.map((k) => [k, money[k] ? Math.round(Number(money[k]) * 100) : 0])),
    };
    try {
      const saved = await api<S>("settings", { method: "PATCH", body: JSON.stringify(body) });
      setCached<S>("settings", () => saved); setF(saved); setMoney(moneyOf(saved));
      toast("Settings saved. The website and WhatsApp bot use them straight away.");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const moneyField = (k: (typeof MONEY)[number], label: string, hint?: string) => (
    <label key={k}><span className="lbl">{label}</span>
      <span className="relative block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
        <input className="field !pl-7" inputMode="decimal" pattern="[0-9]*(\.[0-9]{1,2})?" placeholder={hint ?? "0"} value={money[k] ?? ""} onChange={(e) => setMoney({ ...money, [k]: e.target.value })} /></span></label>
  );
  const toggle = (k: keyof S, label: string, hint?: string) => (
    <label key={k} className="flex items-start gap-3 py-1">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-maroon" checked={!!f[k]} onChange={(e) => set(k, e.target.checked as S[typeof k])} />
      <span><span className="block font-medium">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
    </label>
  );

  return (
    <form onSubmit={save}>
      <PageHeader title="Settings" sub="How the website and the WhatsApp bot take orders." />
      <ErrorLine msg={err} />
      <div className="space-y-5 pb-20 text-sm">
        <Section title="Payments" note="Which ways customers can pay at checkout.">
          {toggle("cod_enabled", "Cash on delivery")}
          {f.cod_enabled && <div className="grid gap-3 pl-7 sm:grid-cols-2">{moneyField("cod_min_amount_paise", "Only on orders over", "No minimum")}{moneyField("cod_max_amount_paise", "Only on orders up to", "No limit")}</div>}
          {toggle("upi_enabled", "UPI")}
          {toggle("razorpay_enabled", "Pay online (cards, UPI, net banking via Razorpay)", f.razorpay_connection_status === "connected" ? "Razorpay account is connected." : "Razorpay is not connected yet. Ask Rahtsaa support to link your Razorpay keys.")}
        </Section>

        <Section title="Delivery" note="Shown to customers before they pay.">
          <div className="grid gap-3 sm:grid-cols-2">
            {moneyField("shipping_charge_paise", "Delivery charge per order", "Free delivery")}
            <label><span className="lbl">Delivery time</span><input className="field" value={f.delivery_time_text} onChange={(e) => set("delivery_time_text", e.target.value)} placeholder="3–5 working days" /></label>
          </div>
        </Section>

        <Section title="Order rules">
          {toggle("auto_confirm_orders", "Confirm orders automatically", "Off: new orders wait under Orders > New until someone confirms them.")}
          <div className="grid gap-3 sm:grid-cols-3">
            {moneyField("min_order_amount_paise", "Smallest order", "No minimum")}
            {moneyField("max_order_amount_paise", "Largest order", "No limit")}
            <label><span className="lbl">Most items in one order</span><input className="field" inputMode="numeric" placeholder="No limit" value={f.max_items_per_order || ""} onChange={(e) => set("max_items_per_order", Number(e.target.value) || 0)} /></label>
            <label><span className="lbl">WhatsApp order numbers start with</span><input className="field uppercase" maxLength={8} value={f.order_number_prefix} onChange={(e) => set("order_number_prefix", e.target.value)} /><span className="mt-1 block text-xs text-muted">Website orders always start with WEB.</span></label>
            <label><span className="lbl">Customer care number</span><input className="field" inputMode="tel" value={f.support_phone} onChange={(e) => set("support_phone", e.target.value)} /></label>
            <label><span className="lbl">Number your team calls customers from</span><input className="field" inputMode="tel" value={f.handoff_number} onChange={(e) => set("handoff_number", e.target.value)} /></label>
          </div>
        </Section>

        <Section title="Stock" note="Where stock counts come from.">
          {toggle("stock_from_salesmanagement", "Take name, price and stock from Sales Management", "On: products with the same name in Sales Management drive price and stock here. Orders not invoiced yet are held back from the count.")}
        </Section>

        <Section title="Messages to customers" note="Sent on WhatsApp when an order changes status. Leave the text empty to use the standard wording shown.">
          <div className="divide-y divide-line">
            {MSG_ORDER.map((s) => (
              <div key={s} className="grid gap-2 py-3 sm:grid-cols-[180px_1fr]">
                <label className="flex items-center gap-2 font-medium"><input type="checkbox" className="h-4 w-4 accent-maroon" checked={msg(s).enabled} onChange={(e) => set("status_messages", { ...f.status_messages, [s]: { ...msg(s), enabled: e.target.checked } })} />{STATUS[s]?.label ?? s}</label>
                <textarea className="field" rows={2} disabled={!msg(s).enabled} placeholder={f.default_status_messages?.[s]} value={msg(s).text} onChange={(e) => set("status_messages", { ...f.status_messages, [s]: { ...msg(s), text: e.target.value } })} aria-label={`Message when ${STATUS[s]?.label ?? s}`} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Referrals" note="Every customer gets a code to share; the friend gets a discount on their first order and the customer earns a reward.">
          {toggle("referrals_enabled", "Turn on referrals")}
          {f.referrals_enabled && <div className="grid gap-3 pl-7 sm:grid-cols-2">{moneyField("referral_referee_discount_paise", "Friend's discount")}{moneyField("referral_reward_paise", "Reward for the customer who shared")}</div>}
        </Section>
      </div>

      <div className={`fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:left-60 ${dirty ? "" : "translate-y-full"} transition-transform`}>
        <div className="mx-auto flex max-w-[1280px] items-center justify-end gap-3">
          <span className="text-sm text-muted">You have unsaved changes</span>
          <button type="button" className="btn-ghost" onClick={onDiscard}>Discard</button>
          <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="panel grid gap-4 p-5 lg:grid-cols-[260px_1fr]">
      <div><h2 className="text-base font-bold text-kadhai">{title}</h2>{note && <p className="mt-0.5 text-xs text-muted">{note}</p>}</div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

