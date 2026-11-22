"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(d.detail || "Invalid email or password.");
        setBusy(false);
        return;
      }
      router.push(nextUrl);
      router.refresh();
    } catch {
      setErr("Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl bg-butter p-8">
        <h1 className="font-display text-3xl font-bold text-kadhai">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to view your orders, track deliveries, and check out faster without email OTP.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="field py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="field py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {err && (
            <p role="alert" className="rounded-xl bg-[#f8eaea] px-3 py-2 text-sm text-maroon">
              {err}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn w-full py-3.5 text-base">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          New to Shatrunjay Ghee?{" "}
          <Link href={`/signup?next=${encodeURIComponent(nextUrl)}`} className="font-semibold text-maroon">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
