"use client";
import { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/admin/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (r.ok) {
        window.location.assign("/admin");
        return;
      }
      const d = await r.json().catch(() => ({}));
      setErr(d.error === "invalid_input" ? "Enter a valid email and password." : "Invalid admin credentials.");
    } catch {
      setErr("Could not reach server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-kadhai px-4">
      <div className="w-full max-w-sm rounded-xl bg-[#fffaf0] px-8 py-10 shadow-2xl">
        <img src="/brand/logo.png" alt="Shatrunjay" className="mx-auto h-24" />
        <h1 className="mt-5 text-center text-lg font-bold text-kadhai">Shop admin</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="lbl">Admin email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="field"
              placeholder="admin@shatrunjayghee.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="lbl">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {err && (
            <p className="text-center text-sm text-red-700" role="alert">
              {err}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn w-full !rounded-md disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-ink/50">Shatrunjay Foodstuffs Pvt Ltd</p>
      </div>
    </div>
  );
}
