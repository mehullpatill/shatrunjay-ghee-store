"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderQueryForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({});
    const res = await fetch(`/api/account/orders/${orderId}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setStatus({ error: data.error || "Could not submit query." });
    } else {
      setStatus({ ok: "Query submitted and emailed to info@shatrunjayghee.com." });
      setSubject("");
      setMessage("");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border border-line bg-white p-6">
      <h3 className="text-lg font-bold text-kadhai">Raise a Query on this Order</h3>
      <input
        type="text"
        required
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject (e.g., Delivery timing or packaging issue)"
        className="field"
      />
      <textarea
        required
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your query..."
        className="field"
      />
      {status.error && <p className="text-xs text-red-700">{status.error}</p>}
      {status.ok && <p className="text-xs text-label font-medium">{status.ok}</p>}
      <button type="submit" disabled={loading} className="btn">
        {loading ? "Sending..." : "Submit Query"}
      </button>
    </form>
  );
}
