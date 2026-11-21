"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", referredByCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Sign up failed");
      return;
    }
    router.push("/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-espresso/10 bg-white p-8 shadow-sm space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-espresso">Sign Up</h1>
          <p className="mt-1 text-xs text-taupe">Create your Shatrunjay Ghee account</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Full Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Phone / WhatsApp</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Password (min 8 chars) *</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Referral Code (optional)</label>
          <input
            value={form.referredByCode}
            onChange={(e) => setForm({ ...form, referredByCode: e.target.value })}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm uppercase focus:border-ghee focus:outline-none"
          />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-espresso py-3 text-sm font-semibold text-cream hover:bg-espresso-light disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <p className="text-center text-xs text-taupe">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ghee-dark hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
