"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignupForm() {
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/checkout";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCodeUsed, setReferralCodeUsed] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({});
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          password,
          referralCodeUsed: referralCodeUsed || undefined,
          website,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setStatus({ error: data.error || "Could not create account." });
      } else {
        setStatus({ ok: data.message || "Account created! Check your email to verify." });
      }
    } catch {
      setStatus({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-kadhai">Sign Up</h1>
        <p className="mt-1 text-sm text-muted">Create your Shatrunjay Ghee account. Email verification is required to place orders.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Full Name *</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Email *</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Phone (optional)</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="field" placeholder="+91 98XXXXXXXX" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Password * (min 8 chars, upper, lower, number)</span>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Referral Code (optional)</span>
            <input type="text" value={referralCodeUsed} onChange={(e) => setReferralCodeUsed(e.target.value.toUpperCase())} className="field" placeholder="SJ-XXXX-XXXXXX" />
          </label>
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

          {status.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{status.error}</p>}
          {status.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{status.ok}</p>}

          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-maroon hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
