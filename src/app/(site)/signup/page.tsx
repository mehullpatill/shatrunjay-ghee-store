"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/account";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referredByCode, setReferredByCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, referredByCode }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(d.detail || "Could not create account.");
        setBusy(false);
        return;
      }
      router.push(nextUrl);
      router.refresh();
    } catch {
      setErr("Could not create account. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl bg-butter p-8">
        <h1 className="font-display text-3xl font-bold text-kadhai">Create account</h1>
        <p className="mt-2 text-sm text-muted">
          Track your orders, raise delivery queries, and check out without OTP verification.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Full name</span>
            <input required className="field py-3" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input type="email" required className="field py-3" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Phone (WhatsApp)</span>
            <input inputMode="tel" className="field py-3" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password (min 6 characters)</span>
            <input type="password" required minLength={6} className="field py-3" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Referral code <span className="font-normal text-muted">(optional)</span>
            </span>
            <input className="field py-3 uppercase" value={referredByCode} onChange={(e) => setReferredByCode(e.target.value)} />
          </label>
          {err && (
            <p role="alert" className="rounded-xl bg-[#f8eaea] px-3 py-2 text-sm text-maroon">
              {err}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn w-full py-3.5 text-base">
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextUrl)}`} className="font-semibold text-maroon">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
