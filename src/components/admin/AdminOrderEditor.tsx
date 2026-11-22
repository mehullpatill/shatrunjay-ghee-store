"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrderEditor({
  order,
}: {
  order: {
    id: string;
    status: string;
    paymentStatus: string;
    courierName: string | null;
    trackingNumber: string | null;
    courierImageUrl: string | null;
    cancelOrRefundNote: string | null;
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [courierName, setCourierName] = useState(order.courierName || "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [courierImageUrl, setCourierImageUrl] = useState(order.courierImageUrl || "");
  const [note, setNote] = useState(order.cancelOrRefundNote || "");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        paymentStatus,
        courierName: courierName || null,
        trackingNumber: trackingNumber || null,
        courierImageUrl: courierImageUrl || null,
        cancelOrRefundNote: note || null,
      }),
    });
    const d = (await res.json()) as { error?: string };
    setMsg(res.ok ? "Order updated & customer notified via email." : d.error || "Update failed");
    setSaving(false);
    router.refresh();
  };

  return (
    <form onSubmit={save} className="panel p-6 space-y-4">
      <h2 className="text-lg font-bold text-kadhai">Update Status &amp; Courier Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Order Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field">
            {["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="lbl">Payment Status</span>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="field">
            {["PENDING", "PAID", "FAILED", "REFUNDED"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="lbl">Courier Name</span>
          <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)} className="field" placeholder="e.g. BlueDart / Porter / Shatrunjay Team" />
        </label>
        <label className="block">
          <span className="lbl">Tracking Number</span>
          <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="field" />
        </label>
      </div>
      <label className="block">
        <span className="lbl">Courier Receipt Image URL (S3)</span>
        <input type="url" value={courierImageUrl} onChange={(e) => setCourierImageUrl(e.target.value)} className="field" placeholder="https://..." />
      </label>
      <label className="block">
        <span className="lbl">Note / Cancel or Refund Reason</span>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="field" />
      </label>
      {msg && <p className="text-xs font-medium text-label">{msg}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn">
          {saving ? "Saving..." : "Save & Notify Customer"}
        </button>
        <button type="button" onClick={() => window.print()} className="btn-ghost">
          Print Invoice
        </button>
      </div>
    </form>
  );
}
