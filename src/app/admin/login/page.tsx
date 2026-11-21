"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, adminOnly: true }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Invalid admin credentials");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-espresso/15 bg-white p-8 shadow-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-espresso p-2.5 text-ghee-light">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-espresso">Shop Admin</h1>
            <p className="text-xs text-taupe">Shatrunjay Foodstuffs Pvt Ltd</p>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Admin Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm"
          />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-espresso py-3 text-sm font-semibold text-cream hover:bg-espresso-light disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In to Admin"}
        </button>
      </form>
    </div>
  );
}
