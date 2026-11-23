"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupees } from "@/lib/pricing";

export default function AdminDiscountsClient({
  promos,
  coupons,
  referralEnabled,
}: {
  promos: Array<{ id: string; code: string; discountType: string; discountValue: number; usageCount: number; active: boolean; showOnWebsite: boolean }>;
  coupons: Array<{ id: string; code: string; discountType: string; discountValue: number; usageCount: number; active: boolean }>;
  referralEnabled: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"promo" | "coupon">("promo");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("10");
  const [maxCapRupees, setMaxCapRupees] = useState("");
  const [minOrderRupees, setMinOrderRupees] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [totalUsageLimit, setTotalUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [msg, setMsg] = useState("");

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = Number(value);
    const discountValue = discountType === "FIXED" ? Math.round(numVal * 100) : Math.round(numVal);
    const maxDiscountPaise = maxCapRupees ? Math.round(Number(maxCapRupees) * 100) : null;

    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: kind === "promo" ? "create_promo" : "create_coupon",
        code,
        discountType,
        discountValue,
        maxDiscountPaise,
        minOrderPaise: Math.round(Number(minOrderRupees || 0) * 100),
        perUserLimit: Number(perUserLimit),
        totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    });
    const d = (await res.json()) as { error?: string };
    setMsg(res.ok ? `Created ${code.toUpperCase()}` : d.error || "Failed");
    setCode("");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-kadhai">Discounts &amp; Referrals</h1>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ settings: { referralEnabled: !referralEnabled } }),
            });
            router.refresh();
          }}
          className="btn-ghost text-xs"
        >
          Referral System: {referralEnabled ? "ON (Click to Disable)" : "OFF (Click to Enable)"}
        </button>
      </div>

      {msg && <p className="rounded-lg bg-butter px-4 py-2 text-sm font-medium text-kadhai">{msg}</p>}

      <form onSubmit={createCode} className="panel p-5 space-y-3">
        <h2 className="text-lg font-bold text-kadhai">Create Promo or Coupon Code</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          <select value={kind} onChange={(e) => setKind(e.target.value as "promo" | "coupon")} className="field">
            <option value="promo">Promo Code (Public)</option>
            <option value="coupon">Coupon Code (Exclusive)</option>
          </select>
          <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE (e.g. DIWALI10)" className="field" />
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")} className="field">
            <option value="PERCENT">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>
          <input type="number" required min="1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value (% or ₹)" className="field" />
          <input type="number" min="0" value={maxCapRupees} onChange={(e) => setMaxCapRupees(e.target.value)} placeholder="Max cap ₹ (optional)" className="field" />
          <input type="number" min="0" value={minOrderRupees} onChange={(e) => setMinOrderRupees(e.target.value)} placeholder="Min order ₹" className="field" />
          <input type="number" min="1" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} placeholder="Per-user uses" className="field" />
          <input type="number" min="1" value={totalUsageLimit} onChange={(e) => setTotalUsageLimit(e.target.value)} placeholder="Total uses" className="field" />
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="field" />
          <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="field" />
        </div>
        <button type="submit" className="btn">Create Code</button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-bold text-kadhai">Promo Codes</h2>
          <div className="mt-3 space-y-2 text-sm">
            {promos.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-line p-3">
                <div>
                  <p className="font-mono font-bold">{p.code}</p>
                  <p className="text-xs text-muted">
                    {p.discountType === "PERCENT" ? `${p.discountValue}%` : formatRupees(p.discountValue)} • Used: {p.usageCount}
                  </p>
                </div>
                <span className="text-xs font-semibold">{p.active ? "Active" : "Paused"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-lg font-bold text-kadhai">Coupon Codes</h2>
          <div className="mt-3 space-y-2 text-sm">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-line p-3">
                <div>
                  <p className="font-mono font-bold">{c.code}</p>
                  <p className="text-xs text-muted">
                    {c.discountType === "PERCENT" ? `${c.discountValue}%` : formatRupees(c.discountValue)} • Used: {c.usageCount}
                  </p>
                </div>
                <span className="text-xs font-semibold">{c.active ? "Active" : "Paused"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
