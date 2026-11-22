"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartContext";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/account";
  const { syncWithServerAfterLogin } = useCart();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totpCode: needsTotp ? totpCode : undefined }),
      });
      const data = (await res.json()) as { error?: string; requiresTotp?: boolean; user?: { role: string } };
      if (!res.ok) {
        if (data.requiresTotp) setNeedsTotp(true);
        setError(data.error || "Login failed");
      } else {
        await syncWithServerAfterLogin();
        const safeReturn = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account";
        router.push(data.user?.role === "ADMIN" && safeReturn === "/account" ? "/admin" : safeReturn);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-kadhai">Log In</h1>
        <p className="mt-1 text-sm text-muted">Access your orders, saved addresses, and checkout.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
          </label>
          {needsTotp && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">2FA Authenticator Code</span>
              <input type="text" required value={totpCode} onChange={(e) => setTotpCode(e.target.value)} className="field" placeholder="6-digit code" />
            </label>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-muted">
          <Link href="/forgot-password" className="hover:text-maroon underline">Forgot password?</Link>
          <Link href={`/signup?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-maroon hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
