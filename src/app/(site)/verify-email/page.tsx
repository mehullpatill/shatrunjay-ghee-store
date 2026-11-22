"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; msg: string }>({
    status: "loading",
    msg: "Verifying your email...",
  });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", msg: "Verification token is missing." });
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { message?: string; error?: string };
        if (res.ok) setState({ status: "ok", msg: data.message || "Email verified!" });
        else setState({ status: "error", msg: data.error || "Verification failed." });
      })
      .catch(() => setState({ status: "error", msg: "Network error." }));
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="rounded-3xl border border-line bg-white p-8">
        <h1 className="text-2xl font-extrabold text-kadhai">Email Verification</h1>
        <p className={`mt-4 text-sm ${state.status === "error" ? "text-red-700" : "text-ink"}`}>{state.msg}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="btn">Log In</Link>
          <Link href="/checkout" className="btn-ghost">Go to Checkout</Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted">Verifying...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
