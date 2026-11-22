"use client";
import { useState } from "react";

export default function ContactForm({ type }: { type: "CONTACT" | "BULK_ENQUIRY" }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          firstName,
          lastName,
          phone,
          email,
          message,
          website,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ error: data.error || "Could not send message." });
      } else {
        setStatus({ ok: data.message || "Message sent successfully." });
        setFirstName("");
        setLastName("");
        setPhone("");
        setEmail("");
        setMessage("");
      }
    } catch {
      setStatus({ error: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-line bg-white p-6 md:p-8">
      <h2 className="text-2xl font-bold text-kadhai">Send a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">First Name *</span>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="field"
            placeholder="First name"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Last Name (optional)</span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="field"
            placeholder="Last name"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Whatsapp Number *</span>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field"
            placeholder="+91 98XXXXXXXX"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="you@example.com"
          />
        </label>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Message *</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="field"
          placeholder={type === "BULK_ENQUIRY" ? "Share required quantity, pack size, and delivery city..." : "How can we help you?"}
        />
      </label>

      {status.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{status.error}</p>}
      {status.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{status.ok}</p>}

      <button type="submit" disabled={submitting} className="btn">
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
