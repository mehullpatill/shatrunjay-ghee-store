"use client";

import React, { useState } from "react";
import { MessageCircle, Mail, MapPin, Send } from "lucide-react";

interface ContactFormCardProps {
  source: "CONTACT" | "BULK_ORDER";
  heading: string;
  subheading?: string | null;
  whatsappNumber: string;
  supportEmail: string;
  storeAddress: string;
  storeMapUrl: string;
}

export function ContactFormCard({
  source,
  heading,
  subheading,
  whatsappNumber,
  supportEmail,
  storeAddress,
  storeMapUrl,
}: ContactFormCardProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    whatsappNumber: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const whatsappDigits = whatsappNumber.replace(/[^\d]/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, source }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setStatus({ type: "err", text: data.error || "Failed to send message." });
      return;
    }
    setStatus({ type: "ok", text: `Message sent to ${supportEmail}. Our team will get back to you shortly.` });
    setForm({ firstName: "", lastName: "", whatsappNumber: "", email: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-espresso md:text-4xl">{heading}</h1>
        {subheading && <p className="mt-2 text-sm text-taupe">{subheading}</p>}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <a
            href={`https://wa.me/${whatsappDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-espresso/10 bg-white p-5 shadow-sm transition hover:border-leaf"
          >
            <div className="rounded-xl bg-leaf/10 p-3 text-leaf">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-espresso">WhatsApp Us</h3>
              <p className="text-xs text-taupe">Quick response on WhatsApp</p>
              <p className="mt-1 text-sm font-semibold text-leaf">{whatsappNumber}</p>
            </div>
          </a>

          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-espresso/10 bg-white p-5 shadow-sm transition hover:border-ghee"
          >
            <div className="rounded-xl bg-ghee/10 p-3 text-ghee-dark">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-espresso">Email Us</h3>
              <p className="text-xs text-taupe">Write to our team directly</p>
              <p className="mt-1 text-sm font-semibold text-ghee-dark">{supportEmail}</p>
            </div>
          </a>

          <a
            href={storeMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-espresso/10 bg-white p-5 shadow-sm transition hover:border-espresso"
          >
            <div className="rounded-xl bg-espresso/10 p-3 text-espresso">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-espresso">Visit Our Store</h3>
              <p className="text-xs text-taupe">Open in Google Maps</p>
              <p className="mt-1 text-sm font-medium text-espresso">{storeAddress}</p>
            </div>
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-espresso/10 bg-white p-6 shadow-sm lg:col-span-3 md:p-8 space-y-4"
        >
          <h2 className="font-serif text-xl font-bold text-espresso">Send a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">First Name *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">Last Name (optional)</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">WhatsApp Number *</label>
              <input
                required
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                placeholder="+91 ..."
                className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-espresso">Message *</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
            />
          </div>

          {status && (
            <p className={`text-xs font-medium ${status.type === "ok" ? "text-leaf" : "text-red-600"}`}>
              {status.text}
            </p>
          )}

          <button
            disabled={submitting}
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-espresso px-6 py-3 text-sm font-semibold text-cream transition hover:bg-espresso-light disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-ghee-light" />
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
