"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountClient({
  user,
  referralEnabled,
}: {
  user: { name: string; email: string; phone: string | null; referralCode: string; emailVerified: boolean };
  referralEnabled: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [msg, setMsg] = useState("");

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setMsg(res.ok ? "Profile updated." : "Could not update profile.");
    router.refresh();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-white p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-kadhai">Profile</h2>
          <button type="button" onClick={logout} className="text-xs font-semibold text-maroon hover:underline">
            Log Out
          </button>
        </div>
        <form onSubmit={saveProfile} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Email</span>
            <input type="text" disabled value={user.email} className="field bg-paper" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Name</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Phone</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
          </label>
          {msg && <p className="text-xs font-medium text-label">{msg}</p>}
          <button type="submit" className="btn">Save Profile</button>
        </form>
      </div>

      <div className="rounded-3xl border border-line bg-butter p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Your Referral Code</p>
        <p className="mt-1 font-mono text-lg font-extrabold text-kadhai">{user.referralCode}</p>
        <p className="mt-1 text-xs text-muted">
          {referralEnabled
            ? "Share this code with friends to unlock referral savings on their first order."
            : "Referral program is currently inactive and will be enabled soon."}
        </p>
      </div>
    </div>
  );
}
