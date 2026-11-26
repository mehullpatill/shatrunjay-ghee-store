"use client";
import { useEffect, useState } from "react";
import type { Order } from "./types";

export const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "New", tone: "bg-ghee-soft text-[#7a5300] ring-ghee/40" },
  payment_pending: { label: "Awaiting payment", tone: "bg-ghee-soft text-[#7a5300] ring-ghee/40" },
  confirmed: { label: "Confirmed", tone: "bg-[#eef1f6] text-[#2d3f5c] ring-[#2d3f5c]/20" },
  processing: { label: "Packing", tone: "bg-[#eef1f6] text-[#2d3f5c] ring-[#2d3f5c]/20" },
  shipped: { label: "Shipped", tone: "bg-[#ecf3f7] text-[#164e63] ring-[#164e63]/20" },
  delivered: { label: "Delivered", tone: "bg-[#e9f3ea] text-leaf ring-leaf/25" },
  cancelled: { label: "Cancelled", tone: "bg-[#f8eaea] text-maroon ring-maroon/20" },
  payment_failed: { label: "Payment failed", tone: "bg-[#f8eaea] text-maroon ring-maroon/20" },
};
// The order a parcel moves through; the detail view offers the next one as the main action.
export const FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];
export const NEXT_LABEL: Record<string, string> = { confirmed: "Confirm order", processing: "Start packing", shipped: "Mark shipped", delivered: "Mark delivered" };
export const PAY_LABEL: Record<string, string> = { cod: "Cash on delivery", razorpay: "Online (Razorpay)", upi: "UPI", bank_transfer: "Bank transfer", cheque: "Cheque", unset: "Not chosen" };

export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "bg-paper text-muted ring-line" };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.tone}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />{s.label}
    </span>
  );
}

export function SourceTag({ source }: { source: string }) {
  return source === "web"
    ? <span className="rounded bg-kadhai/5 px-1.5 py-0.5 text-[11px] font-semibold text-kadhai-2">Website</span>
    : <span className="rounded bg-[#e7f5ec] px-1.5 py-0.5 text-[11px] font-semibold text-[#14713a]">WhatsApp</span>;
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[1.75rem] font-bold leading-tight text-kadhai">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Skeleton({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-2 p-4">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-10 animate-pulse rounded bg-paper" />)}</div>;
}

export function ErrorLine({ msg }: { msg: string }) {
  return msg ? <p role="alert" className="mb-3 rounded-md border border-maroon/20 bg-[#f8eaea] px-3 py-2 text-sm text-maroon">{msg}</p> : null;
}

// Right-hand sheet for editing one record without leaving the list.
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-kadhai/30" onClick={onClose} />
      <div className={`relative flex h-full w-full flex-col bg-white shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-lg font-bold text-kadhai">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-paper hover:text-ink" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// One toast at a time, bottom-centre; fired from anywhere with toast("Saved").
let push: ((m: string) => void) | null = null;
export const toast = (m: string) => push?.(m);
export function Toaster() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    push = (m) => { setMsg(m); clearTimeout(t); t = setTimeout(() => setMsg(""), 2600); };
    return () => { push = null; };
  }, []);
  return msg ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-kadhai px-4 py-2.5 text-sm text-white shadow-lg">{msg}</div> : null;
}

export const customerName = (o: Order) => o.shipping_address?.name || o.contact_name || "Unnamed customer";
export const customerPhone = (o: Order) => o.shipping_address?.phone || o.contact_phone || "";
export const addressText = (o: Order) => {
  const a = o.shipping_address ?? {};
  return [a.address_line, a.area, a.city, a.state, a.pincode].filter(Boolean).join(", ");
};
export const orderRef = (o: Order) => o.order_number ?? `#${o.id.slice(0, 8)}`;
export const due = (o: Order) => Math.max(0, o.total_paise - (o.paid_paise ?? 0));

export function when(iso: string) {
  const d = new Date(iso), mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}
// wa.me needs a full international number; Indian 10-digit numbers get 91 in front.
export const waLink = (phone: string) => { const d = phone.replace(/\D/g, ""); return `https://wa.me/${d.length === 10 ? "91" + d : d}`; };

