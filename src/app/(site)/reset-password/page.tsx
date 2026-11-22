"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({});
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = (await res.json()) as { message?: string; error?: string };
    if (res.ok) setStatus({ ok: data.message || "Password updated!" });
    else setStatus({ error: data.error || "Reset failed." });
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
        <h1 className="text-2xl font-extrabold text-kadhai">Reset Password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">New Password</span>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
          </label>
          {status.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{status.error}</p>}
          {status.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{status.ok}</p>}
          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/login" className="hover:text-maroon underline">Go to Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted">Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
