"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(data.user.role === "ADMIN" ? "/admin" : "/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-espresso/10 bg-white p-8 shadow-sm space-y-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-espresso">Log In</h1>
          <p className="mt-1 text-xs text-taupe">Check your orders, tracking & raise order queries</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-espresso/20 px-3.5 py-2.5 text-sm focus:border-ghee focus:outline-none"
          />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-espresso py-3 text-sm font-semibold text-cream hover:bg-espresso-light disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Log In"}
        </button>
        <p className="text-center text-xs text-taupe">
          New to Shatrunjay?{" "}
          <Link href="/signup" className="font-semibold text-ghee-dark hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
