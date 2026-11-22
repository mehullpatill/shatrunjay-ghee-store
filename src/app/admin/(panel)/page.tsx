"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/adminApi";
import { rupees } from "@/lib/format";
import type { Order, Product, Report } from "./types";
import { ErrorLine, PageHeader, PAY_LABEL, Skeleton, SourceTag, StatusPill, customerName, orderRef, when } from "./ui";

const LOW_STOCK = 5;

export default function Overview() {
  const [days, setDays] = useState(30);
  const { data: r, error } = useApi<Report>(`reports?days=${days}`);
  const { data: orders } = useApi<Order[]>("orders");
  const { data: products } = useApi<Product[]>("products");
  const [now] = useState(() => Date.now());

  const fresh = orders?.filter((o) => o.status === "pending").length ?? 0;
  const unpaid = orders?.filter((o) => o.status === "payment_pending").length ?? 0;
  const help = orders?.filter((o) => o.needs_human_help && !["delivered", "cancelled"].includes(o.status)).length ?? 0;
  const low = products?.filter((p) => !p.in_stock || (p.stock_qty !== null && p.stock_qty <= LOW_STOCK)).length ?? 0;
  const since = now - days * 864e5;
  const inRange = orders?.filter((o) => new Date(o.created_at).getTime() >= since && o.status !== "cancelled") ?? [];
  const wa = inRange.filter((o) => o.source !== "web").length;

  return (
    <div>
      <PageHeader title="Overview" sub="How the shop is doing, and what needs you today.">
        <div role="group" aria-label="Period" className="inline-flex rounded-md border border-line bg-white p-0.5 text-sm">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} aria-pressed={days === d}
              className={`rounded px-3 py-1 ${days === d ? "bg-kadhai text-white" : "text-muted hover:text-ink"}`}>{d} days</button>
          ))}
        </div>
      </PageHeader>
      <ErrorLine msg={error} />

      {/* The one loud thing on the page: work waiting for the owner. */}
      <section aria-label="Needs you" className="mb-6 grid overflow-hidden rounded-lg border border-ghee/50 bg-ghee-soft sm:grid-cols-2 lg:grid-cols-4">
        {[
          { n: fresh, label: "new orders to confirm", href: "/admin/orders?status=pending" },
          { n: unpaid, label: "waiting for online payment", href: "/admin/orders?status=payment_pending" },
          { n: help, label: "customers asked for a person", href: "/admin/orders?status=help" },
          { n: low, label: `products out of stock or ${LOW_STOCK} and under`, href: "/admin/products?filter=low" },
        ].map((x) => (
          <Link key={x.label} href={x.href} className="group border-ghee/30 px-5 py-4 transition-colors hover:bg-ghee/15 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
            <span className={`block font-[family-name:var(--font-display)] text-3xl font-extrabold leading-none ${x.n ? "text-kadhai" : "text-kadhai/35"}`}>{orders ? x.n : "–"}</span>
            <span className="mt-1.5 block text-sm text-[#5c4300] group-hover:underline">{x.label}</span>
          </Link>
        ))}
      </section>

      {!r ? <div className="panel"><Skeleton rows={4} /></div> : (
        <>
          <section aria-label="Totals" className="panel mb-6 grid grid-cols-2 divide-line md:grid-cols-3 lg:grid-cols-6 lg:divide-x">
            {[
              ["Sales", rupees(r.total_revenue_paise)],
              ["Orders", r.total_orders.toLocaleString("en-IN")],
              ["Average order", r.total_orders ? rupees(Math.round(r.total_revenue_paise / r.total_orders / 100) * 100) : "—"],
              ["Money received", rupees(r.collected_paise)],
              ["Still to collect", rupees(r.outstanding_paise)],
              ["Repeat customers", r.first_vs_repeat.first + r.first_vs_repeat.repeat ? `${Math.round((100 * r.first_vs_repeat.repeat) / (r.first_vs_repeat.first + r.first_vs_repeat.repeat))}%` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="px-5 py-4">
                <p className="text-xs text-muted">{k}</p>
                <p className={`mt-1 text-xl font-semibold ${k === "Still to collect" && r.outstanding_paise ? "text-maroon" : "text-ink"}`}>{v}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="panel p-5">
              <h2 className="text-base font-bold text-kadhai">Sales per day</h2>
              <p className="text-xs text-muted">Last {days} days, cancelled orders left out</p>
              <SalesChart daily={r.daily} days={days} now={now} />
            </section>

            <section className="panel p-5">
              <h2 className="text-base font-bold text-kadhai">Best sellers</h2>
              {!r.top_products.length ? <p className="mt-3 text-sm text-muted">No sales in this period yet.</p> : (
                <ol className="mt-3 space-y-3">
                  {r.top_products.slice(0, 6).map((p) => {
                    const max = r.top_products[0].quantity || 1;
                    return (
                      <li key={p.name}>
                        <div className="flex justify-between gap-3 text-sm"><span className="truncate">{p.name}</span><span className="shrink-0 font-medium">{p.quantity} sold</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-paper"><div className="h-1.5 rounded-full bg-maroon" style={{ width: `${(100 * p.quantity) / max}%` }} /></div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <h3 className="mt-6 text-sm font-bold text-kadhai">Where orders come from</h3>
              <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-paper" aria-hidden>
                <div className="bg-[#14713a]" style={{ width: `${inRange.length ? (100 * wa) / inRange.length : 0}%` }} />
                <div className="ml-0.5 flex-1 bg-kadhai-2" style={{ display: inRange.length - wa ? undefined : "none" }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted"><span>WhatsApp {wa}</span><span>Website {inRange.length - wa}</span></div>
              <h3 className="mt-6 text-sm font-bold text-kadhai">How people pay</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(r.by_payment_method).sort((a, b) => b[1] - a[1]).map(([m, n]) => (
                  <li key={m} className="flex justify-between"><span className="text-muted">{PAY_LABEL[m] ?? m}</span><span>{n}</span></li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      <section className="panel mt-6">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-base font-bold text-kadhai">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-maroon hover:underline">All orders</Link>
        </div>
        {!orders ? <Skeleton rows={4} /> : (
          <ul className="divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders?open=${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-paper">
                  <span className="w-28 font-semibold">{orderRef(o)}</span>
                  <span className="min-w-0 flex-1 truncate">{customerName(o)}</span>
                  <SourceTag source={o.source} />
                  <span className="w-24 text-right font-medium">{rupees(o.total_paise)}</span>
                  <span className="w-36"><StatusPill status={o.status} /></span>
                  <span className="w-20 text-right text-xs text-muted">{when(o.created_at)}</span>
                </Link>
              </li>
            ))}
            {!orders.length && <li className="px-5 py-8 text-center text-sm text-muted">No orders yet. They appear here the moment a customer orders on WhatsApp or the website.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}

function SalesChart({ daily, days, now }: { daily: Report["daily"]; days: number; now: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 864e5).toISOString().slice(0, 10);
    return byDate.get(d) ?? { date: d, orders: 0, revenue_paise: 0 };
  });
  const peak = Math.max(...series.map((s) => s.revenue_paise), 0);
  const max = peak || 1;
  const W = 720, H = 200, TOP = 22, gap = 2, bw = W / days - gap;
  const label = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const h = hover !== null ? series[hover] : null;
  return (
    <div className="relative mt-4">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label={`Daily sales for the last ${days} days, best day ${rupees(peak)}`} onMouseLeave={() => setHover(null)}>
        {[0.5, 1].map((f) => <line key={f} x1="0" x2={W} y1={H - (H - TOP) * f} y2={H - (H - TOP) * f} stroke="var(--color-line)" strokeDasharray="3 4" />)}
        <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-line)" />
        {series.map((s, i) => {
          const bh = s.revenue_paise ? Math.max(5, ((H - TOP) * s.revenue_paise) / max) : 0;
          const x = i * (bw + gap);
          return (
            <g key={s.date} onMouseEnter={() => setHover(i)}>
              <rect x={x - gap / 2} y="0" width={bw + gap} height={H} fill="transparent" />
              {bh > 0 && <path d={`M${x},${H} v${-(bh - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${bh - 4} z`} fill={hover === i ? "var(--color-maroon-dark)" : "var(--color-maroon)"} />}
            </g>
          );
        })}
        <text x="0" y={H + 16} fontSize="11" fill="var(--color-muted)">{label(series[0].date)}</text>
        <text x={W} y={H + 16} fontSize="11" fill="var(--color-muted)" textAnchor="end">Today</text>
        {peak > 0 && <text x="0" y="12" fontSize="11" fill="var(--color-muted)">Best day {rupees(peak)}</text>}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 rounded-md bg-kadhai px-2.5 py-1.5 text-xs text-white shadow"
          style={{ left: `clamp(0px, calc(${((hover! + 0.5) / days) * 100}% - 60px), calc(100% - 120px))` }}>
          <p className="font-semibold">{label(h.date)}</p>
          <p>{rupees(h.revenue_paise)} from {h.orders} order{h.orders === 1 ? "" : "s"}</p>
        </div>
      )}
    </div>
  );
}
