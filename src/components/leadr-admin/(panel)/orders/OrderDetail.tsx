"use client";
import { useState } from "react";
import { api, refresh, setCached, useApi } from "@/lib/adminApi";
import { rupees } from "@/lib/format";
import type { Order, Payment } from "../types";
import { FLOW, NEXT_LABEL, PAY_LABEL, SourceTag, StatusPill, addressText, customerName, customerPhone, due, toast, waLink } from "../ui";

const today = () => new Date().toISOString().slice(0, 10);

export default function OrderDetail({ order: o }: { order: Order }) {
  const { data: payments, reload: reloadPayments } = useApi<Payment[]>(`orders/${o.id}/payments`);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pay, setPay] = useState<null | { method: string; amount: string; paid_on: string; note: string }>(null);
  const [ship, setShip] = useState<null | { provider: string; awb: string }>(null);

  const step = FLOW.indexOf(o.status);
  const next = step >= 0 && step < FLOW.length - 1 ? FLOW[step + 1] : o.status === "payment_pending" ? "confirmed" : null;
  const phone = customerPhone(o);

  async function run(label: string, fn: () => Promise<unknown>, done: string) {
    setBusy(label); setErr("");
    try { await fn(); toast(done); refresh("reports"); } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }
  const putOrder = (u: Order) => setCached<Order[]>("orders", (list) => (list ?? []).map((x) => (x.id === u.id ? u : x)));
  const setStatus = (status: string) => run(status, async () => {
    putOrder(await api<Order>(`orders/${o.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }));
    setConfirmCancel(false);
  }, status === "cancelled" ? "Order cancelled" : "Status updated, customer notified where messages are on");

  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={o.status} /><SourceTag source={o.source} />
        <span className="text-muted">Placed {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
      </div>

      {err && <p role="alert" className="rounded-md bg-[#f8eaea] px-3 py-2 text-maroon">{err}</p>}

      {o.status !== "cancelled" && o.status !== "delivered" && (
        <div className="flex flex-wrap items-center gap-2">
          {next && <button className="btn" disabled={!!busy} onClick={() => setStatus(next)}>{busy === next ? "Saving…" : NEXT_LABEL[next]}</button>}
          {!confirmCancel
            ? <button className="btn-ghost" onClick={() => setConfirmCancel(true)}>Cancel order</button>
            : <span className="flex items-center gap-2 rounded-md bg-[#f8eaea] px-3 py-1.5 text-maroon">Cancel this order?
                <button className="font-semibold underline" disabled={!!busy} onClick={() => setStatus("cancelled")}>Yes, cancel</button>
                <button className="text-muted underline" onClick={() => setConfirmCancel(false)}>Keep it</button></span>}
          <select className="field !w-auto !py-1.5 text-xs" value="" aria-label="Set any status" onChange={(e) => e.target.value && setStatus(e.target.value)}>
            <option value="">Set status…</option>
            {["pending", "payment_pending", "confirmed", "processing", "shipped", "delivered"].filter((s) => s !== o.status).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      )}

      <section className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 font-bold text-kadhai">Customer</h3>
          <p className="font-medium">{customerName(o)}</p>
          {phone && <p className="mt-0.5 flex flex-wrap gap-3"><a className="text-maroon hover:underline" href={`tel:${phone}`}>{phone}</a><a className="text-[#14713a] hover:underline" href={waLink(phone)} target="_blank" rel="noreferrer">WhatsApp</a></p>}
          {o.shipping_address?.email && <p className="text-muted">{o.shipping_address.email}</p>}
        </div>
        <div>
          <h3 className="mb-1 font-bold text-kadhai">Deliver to</h3>
          <p className="whitespace-pre-line text-ink">{addressText(o) || <span className="text-muted">No address given yet</span>}</p>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-bold text-kadhai">Items</h3>
        <table className="w-full">
          <tbody className="divide-y divide-line">
            {o.items.map((i) => (
              <tr key={i.id}><td className="py-2">{i.product_name}</td><td className="py-2 text-right text-muted">{i.quantity} × {rupees(i.unit_price_paise)}</td><td className="w-24 py-2 text-right font-medium">{rupees(i.quantity * i.unit_price_paise)}</td></tr>
            ))}
          </tbody>
          <tfoot className="text-muted">
            <tr className="border-t border-line"><td colSpan={2} className="pt-2 text-right">Items</td><td className="pt-2 text-right">{rupees(o.subtotal_paise)}</td></tr>
            {o.discount_paise > 0 && <tr><td colSpan={2} className="text-right">Discount</td><td className="text-right text-leaf">−{rupees(o.discount_paise)}</td></tr>}
            <tr><td colSpan={2} className="text-right">Delivery</td><td className="text-right">{o.shipping_paise ? rupees(o.shipping_paise) : "Free"}</td></tr>
            <tr className="text-base text-ink"><td colSpan={2} className="pt-1 text-right font-bold">Total</td><td className="pt-1 text-right font-bold">{rupees(o.total_paise)}</td></tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-lg border border-line p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-bold text-kadhai">Payment</h3>
          <span className="text-muted">{PAY_LABEL[o.payment_method ?? "unset"] ?? o.payment_method}</span>
        </div>
        <p className="mt-1">
          Received <b>{rupees(o.paid_paise ?? 0)}</b> of {rupees(o.total_paise)}
          {o.status !== "cancelled" && (due(o) ? <span className="text-maroon">, {rupees(due(o))} still to collect</span> : <span className="text-leaf">, fully paid</span>)}
        </p>
        {!!payments?.length && (
          <ul className="mt-3 divide-y divide-line rounded-md bg-paper/60 px-3">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{PAY_LABEL[p.method] ?? p.method}{p.note ? <span className="text-muted">, {p.note}</span> : null}{p.source === "salesmanagement" && <span className="ml-2 rounded bg-white px-1.5 text-[11px] text-muted ring-1 ring-line">from Sales Management</span>}</span>
                <span className={p.status === "success" ? "" : "text-muted"}>{rupees(p.amount_paise)} {p.status !== "success" && `(${p.status})`} <span className="text-xs text-muted">{p.paid_on ?? p.created_at.slice(0, 10)}</span></span>
              </li>
            ))}
          </ul>
        )}
        {!pay ? (
          o.status !== "cancelled" && <button className="mt-3 font-medium text-maroon hover:underline" onClick={() => setPay({ method: o.payment_method === "upi" ? "upi" : "cod", amount: String(due(o) / 100), paid_on: today(), note: "" })}>Record a payment</button>
        ) : (
          <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
            e.preventDefault();
            run("pay", async () => {
              await api(`orders/${o.id}/payments`, { method: "POST", body: JSON.stringify({ method: pay.method, amount_paise: Math.round(Number(pay.amount) * 100), status: "success", paid_on: pay.paid_on, note: pay.note || null }) });
              setPay(null); reloadPayments(); refresh("orders");
            }, "Payment recorded");
          }}>
            <label><span className="lbl">Paid by</span>
              <select className="field" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                {["cod", "upi", "bank_transfer", "cheque", "razorpay"].map((m) => <option key={m} value={m}>{PAY_LABEL[m]}</option>)}
              </select></label>
            <label><span className="lbl">Amount (₹)</span><input className="field" required inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></label>
            <label><span className="lbl">Date received</span><input className="field" type="date" required value={pay.paid_on} onChange={(e) => setPay({ ...pay, paid_on: e.target.value })} /></label>
            <label><span className="lbl">Note (optional)</span><input className="field" placeholder="UTR or cheque no." value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></label>
            <div className="flex gap-2 sm:col-span-2"><button className="btn" disabled={busy === "pay"}>{busy === "pay" ? "Saving…" : "Save payment"}</button><button type="button" className="btn-ghost" onClick={() => setPay(null)}>Cancel</button></div>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-line p-4">
        <h3 className="font-bold text-kadhai">Shipping</h3>
        <p className="mt-1 text-muted">Invoice: {o.vyapar_invoice_number ? <span className="text-ink">{o.vyapar_invoice_number}</span> : "not made yet (raised in Sales Management)"}</p>
        {!ship ? (
          o.status !== "cancelled" && <button className="mt-2 font-medium text-maroon hover:underline" onClick={() => setShip({ provider: "", awb: "" })}>Add courier and tracking number</button>
        ) : (
          <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
            e.preventDefault();
            run("ship", async () => {
              await api(`orders/${o.id}/shipment`, { method: "POST", body: JSON.stringify({ provider: ship.provider, awb: ship.awb || null }) });
              setShip(null); refresh("orders");
            }, "Courier details saved");
          }}>
            <label><span className="lbl">Courier</span><input className="field" required list="couriers" placeholder="e.g. Delhivery" value={ship.provider} onChange={(e) => setShip({ ...ship, provider: e.target.value })} /></label>
            <datalist id="couriers">{["Delhivery", "DTDC", "Blue Dart", "India Post", "Shiprocket", "Own delivery"].map((c) => <option key={c} value={c} />)}</datalist>
            <label><span className="lbl">Tracking / AWB number</span><input className="field" value={ship.awb} onChange={(e) => setShip({ ...ship, awb: e.target.value })} /></label>
            <div className="flex gap-2 sm:col-span-2"><button className="btn" disabled={busy === "ship"}>{busy === "ship" ? "Saving…" : "Save courier"}</button><button type="button" className="btn-ghost" onClick={() => setShip(null)}>Cancel</button></div>
          </form>
        )}
      </section>

      {!!o.events?.length && (
        <section>
          <h3 className="mb-2 font-bold text-kadhai">History</h3>
          <ol className="relative space-y-3 border-l border-line pl-4">
            {[...o.events].reverse().map((e, i) => (
              <li key={i} className="relative">
                <span aria-hidden className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-ghee" : "bg-line"}`} />
                <p>{e.action}</p>
                <p className="text-xs text-muted">{new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}{e.by ? "" : ", by the bot"}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

