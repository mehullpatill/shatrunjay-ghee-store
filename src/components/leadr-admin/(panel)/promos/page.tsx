"use client";
import { useState } from "react";
import { api, setCached, useApi } from "@/lib/adminApi";
import { rupees } from "@/lib/format";
import type { Promo, Referral } from "../types";
import { Empty, ErrorLine, PageHeader, Sheet, Skeleton, toast, waLink } from "../ui";

const offer = (p: Promo) => (p.discount_type === "percent" ? `${p.discount_value}% off${p.max_discount_paise ? `, up to ${rupees(p.max_discount_paise)}` : ""}` : `${rupees(p.discount_value)} off`);
const expired = (p: Promo) => !!p.expires_at && new Date(p.expires_at) < new Date();

export default function Promos() {
  const [tab, setTab] = useState<"promos" | "referrals">("promos");
  return (
    <div>
      <PageHeader title="Promos & referrals" sub="Codes customers type at checkout or in WhatsApp, and who is bringing in new buyers." />
      <div className="mb-4 inline-flex rounded-md border border-line bg-white p-0.5 text-sm" role="tablist">
        {([["promos", "Promo codes"], ["referrals", "Referrals"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded px-4 py-1.5 ${tab === k ? "bg-kadhai text-white" : "text-muted hover:text-ink"}`}>{l}</button>
        ))}
      </div>
      {tab === "promos" ? <PromoList /> : <Referrals />}
    </div>
  );
}

function PromoList() {
  const { data: promos, error } = useApi<Promo[]>("promo-codes");
  const [edit, setEdit] = useState<Promo | "new" | null>(null);
  return (
    <>
      <ErrorLine msg={error} />
      <div className="panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm text-muted">{promos ? ((n) => (n === 1 ? "1 code is live" : `${n} codes are live`))(promos.filter((p) => p.is_active && !expired(p)).length) : ""}</p>
          <button className="btn" onClick={() => setEdit("new")}>New promo code</button>
        </div>
        {!promos ? <Skeleton rows={3} /> : !promos.length ? <Empty title="No promo codes yet">Make one for a festival offer or a first-order discount.</Empty> : (
          <ul className="divide-y divide-line">
            {promos.map((p) => (
              <li key={p.id}>
                <button onClick={() => setEdit(p)} className="flex w-full flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-left text-sm hover:bg-paper">
                  <span className="w-36 font-mono text-[15px] font-semibold tracking-wide text-kadhai">{p.code}</span>
                  <span className="min-w-40 flex-1"><span className="block font-medium">{offer(p)}</span><span className="block text-xs text-muted">{p.description || (p.min_order_paise ? `On orders over ${rupees(p.min_order_paise)}` : "Any order")}</span></span>
                  <span className="w-28 text-right"><span className="block">{p.times_used} used</span><span className="block text-xs text-muted">{rupees(p.discount_given_paise)} given</span></span>
                  <span className="w-28 text-right">
                    {!p.is_active ? <span className="text-muted">Paused</span> : expired(p) ? <span className="text-muted">Expired</span> : <span className="font-medium text-leaf">Live</span>}
                    {p.expires_at && !expired(p) && <span className="block text-xs text-muted">until {new Date(p.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "New promo code" : edit ? `Edit ${edit.code}` : ""}>
        {edit && <PromoForm key={edit === "new" ? "new" : edit.id} p={edit === "new" ? null : edit} onDone={() => setEdit(null)} />}
      </Sheet>
    </>
  );
}

const toDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const r = (paise: number) => (paise ? String(paise / 100) : "");

function PromoForm({ p, onDone }: { p: Promo | null; onDone: () => void }) {
  const [f, setF] = useState({
    code: p?.code ?? "", description: p?.description ?? "", discount_type: p?.discount_type ?? "percent",
    value: p ? (p.discount_type === "flat" ? String(p.discount_value / 100) : String(p.discount_value)) : "",
    min: r(p?.min_order_paise ?? 0), max: r(p?.max_discount_paise ?? 0), usage_limit: p?.usage_limit ? String(p.usage_limit) : "",
    per_contact_limit: String(p?.per_contact_limit ?? 1), starts_at: toDate(p?.starts_at ?? null), expires_at: toDate(p?.expires_at ?? null), is_active: p?.is_active ?? true,
  });
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const paise = (s: string) => Math.round(Number(s || 0) * 100);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy("save"); setErr("");
    const body = {
      code: f.code.trim().toUpperCase(), description: f.description, discount_type: f.discount_type,
      discount_value: f.discount_type === "flat" ? paise(f.value) : Number(f.value),
      min_order_paise: paise(f.min), max_discount_paise: f.discount_type === "percent" ? paise(f.max) : 0,
      usage_limit: Number(f.usage_limit || 0), per_contact_limit: Number(f.per_contact_limit || 0),
      starts_at: f.starts_at ? new Date(`${f.starts_at}T00:00:00+05:30`).toISOString() : null,
      expires_at: f.expires_at ? new Date(`${f.expires_at}T23:59:59+05:30`).toISOString() : null,
      is_active: f.is_active,
    };
    try {
      const saved = await api<Promo>(p ? `promo-codes/${p.id}` : "promo-codes", { method: p ? "PATCH" : "POST", body: JSON.stringify(body) });
      setCached<Promo[]>("promo-codes", (list) => (p ? (list ?? []).map((x) => (x.id === saved.id ? saved : x)) : [saved, ...(list ?? [])]));
      toast(p ? "Promo code saved" : `${saved.code} is ready to use`); onDone();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }
  async function remove() {
    try {
      await api(`promo-codes/${p!.id}`, { method: "DELETE" });
      setCached<Promo[]>("promo-codes", (list) => (list ?? []).filter((x) => x.id !== p!.id));
      toast("Promo code deleted"); onDone();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <form onSubmit={save} className="space-y-4 text-sm">
      {err && <p role="alert" className="rounded-md bg-[#f8eaea] px-3 py-2 text-maroon">{err}</p>}
      <label className="block"><span className="lbl">Code customers type</span><input className="field font-mono uppercase" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="DIWALI10" /></label>
      <label className="block"><span className="lbl">Note for yourself (optional)</span><input className="field" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Diwali offer for WhatsApp list" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="lbl">Discount type</span>
          <select className="field" value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value as "percent" | "flat" })}><option value="percent">Percentage off</option><option value="flat">Fixed rupees off</option></select></label>
        <label><span className="lbl">{f.discount_type === "percent" ? "Percent off" : "Rupees off"}</span><input className="field" required inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label>
        <label><span className="lbl">Minimum order (₹, optional)</span><input className="field" inputMode="decimal" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></label>
        {f.discount_type === "percent" && <label><span className="lbl">Largest discount (₹, optional)</span><input className="field" inputMode="decimal" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></label>}
        <label><span className="lbl">Total uses allowed (empty = no limit)</span><input className="field" inputMode="numeric" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} /></label>
        <label><span className="lbl">Uses per customer (0 = no limit)</span><input className="field" inputMode="numeric" value={f.per_contact_limit} onChange={(e) => setF({ ...f, per_contact_limit: e.target.value })} /></label>
        <label><span className="lbl">Starts (optional)</span><input className="field" type="date" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} /></label>
        <label><span className="lbl">Ends (optional)</span><input className="field" type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} /></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />Code is live</label>
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button className="btn" disabled={!!busy}>{busy ? "Saving…" : p ? "Save code" : "Create code"}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
        {p && (!confirmDelete
          ? <button type="button" className="ml-auto text-maroon hover:underline" onClick={() => setConfirmDelete(true)}>Delete</button>
          : <span className="ml-auto flex items-center gap-2 text-maroon">Delete {p.code}? <button type="button" className="font-semibold underline" onClick={remove}>Yes</button><button type="button" className="text-muted underline" onClick={() => setConfirmDelete(false)}>No</button></span>)}
      </div>
    </form>
  );
}

function Referrals() {
  const { data: refs, error } = useApi<Referral[]>("referrals");
  return (
    <>
      <ErrorLine msg={error} />
      <div className="panel">
        <p className="border-b border-line px-4 py-3 text-sm text-muted">Customers who shared their code, and what it brought in. Turn referrals on and set the rewards in Settings.</p>
        {!refs ? <Skeleton rows={3} /> : !refs.length ? <Empty title="No referrals yet">When a new customer orders with someone&apos;s code, that person shows up here.</Empty> : (
          <ul className="divide-y divide-line">
            {refs.map((x) => (
              <li key={x.contact_id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-40 flex-1"><span className="block font-medium">{x.name || "Unnamed"}</span>{x.phone && <a className="text-xs text-muted hover:text-[#14713a]" href={waLink(x.phone)} target="_blank" rel="noreferrer">{x.phone}</a>}</span>
                <span className="w-28 font-mono text-kadhai">{x.referral_code ?? "—"}</span>
                <span className="w-28 text-right">{x.orders_referred} order{x.orders_referred === 1 ? "" : "s"}</span>
                <span className="w-28 text-right font-medium">{rupees(x.revenue_paise)}</span>
                <span className="w-32 text-right text-xs text-muted">{rupees(x.discount_given_paise)} in discounts</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

