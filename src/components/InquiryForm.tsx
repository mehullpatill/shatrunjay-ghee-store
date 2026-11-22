"use client";
import { useState } from "react";

export default function InquiryForm({
  type,
  title,
  note,
}: {
  type: "CONTACT" | "WHOLESALE" | "BULK";
  title: string;
  note: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, email, phone, city, message }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.detail || "Could not send your inquiry.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setErr("Could not send your inquiry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-butter p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-kadhai">Thank you!</h2>
        <p className="mt-2 text-muted">We have received your inquiry and will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-butter p-8 space-y-4">
      <h2 className="font-display text-2xl font-bold text-kadhai">{title}</h2>
      <p className="text-sm text-muted">{note}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-sm font-medium">Name</span>
          <input required className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium">Phone / WhatsApp</span>
          <input required inputMode="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium">City</span>
          <input className="field" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Details / quantity</span>
        <textarea required rows={4} className="field" value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      {err && <p className="text-sm text-maroon">{err}</p>}
      <button type="submit" disabled={busy} className="btn py-3 px-6">
        {busy ? "Sending…" : "Submit inquiry"}
      </button>
    </form>
  );
}
