"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as { message?: string; error?: string };
    setMsg(data.message || data.error || "Request sent.");
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
        <h1 className="text-2xl font-extrabold text-kadhai">Forgot Password</h1>
        <p className="mt-1 text-sm text-muted">Enter your email and we will send a password reset link.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
          {msg && <p className="rounded-lg bg-butter px-3 py-2 text-sm text-kadhai">{msg}</p>}
          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/login" className="hover:text-maroon underline">Back to Log In</Link>
        </p>
      </div>
    </div>
  );
}
