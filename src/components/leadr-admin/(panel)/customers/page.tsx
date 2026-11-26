"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApi } from "@/lib/adminApi";
import { rupees } from "@/lib/format";
import type { Order } from "../types";
import { Empty, ErrorLine, PageHeader, Sheet, Skeleton, StatusPill, addressText, customerName, customerPhone, due, orderRef, waLink, when } from "../ui";

type Customer = { id: string; name: string; phone: string; city: string; address: string; orders: Order[]; spent: number; owed: number; last: string; channels: Set<string> };

export default function Customers() {
  // shortcut: built from the order list, so only people who have ordered appear; fine at shop scale, switch to a contacts endpoint past ~10k orders.
  const { data: orders, error } = useApi<Order[]>("orders");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"last" | "spent" | "orders">("last");
  const [openId, setOpenId] = useState<string | null>(null);

  const customers = useMemo(() => {
    const m = new Map<string, Customer>();
    for (const o of orders ?? []) { // newest first, so the first order seen carries the latest name/address
      let c = m.get(o.contact_id);
      if (!c) m.set(o.contact_id, (c = { id: o.contact_id, name: customerName(o), phone: customerPhone(o), city: o.shipping_address?.city ?? "", address: addressText(o), orders: [], spent: 0, owed: 0, last: o.created_at, channels: new Set() }));
      c.orders.push(o); c.channels.add(o.source);
      if (o.status !== "cancelled" && o.status !== "payment_failed") { c.spent += o.total_paise; c.owed += due(o); }
    }
    return [...m.values()];
  }, [orders]);

  const needle = q.trim().toLowerCase();
  const shown = customers
    .filter((c) => !needle || [c.name, c.phone, c.city].some((v) => v.toLowerCase().includes(needle)))
    .sort((a, b) => (sort === "spent" ? b.spent - a.spent : sort === "orders" ? b.orders.length - a.orders.length : b.last.localeCompare(a.last)));
  const open = customers.find((c) => c.id === openId);
  const repeat = customers.filter((c) => c.orders.length > 1).length;

  return (
    <div>
      <PageHeader title="Customers" sub={orders ? `${customers.length} people have ordered, ${repeat} of them more than once.` : "Everyone who has ordered."} />
      <ErrorLine msg={error} />
      <div className="panel">
        <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
          <input className="field !w-72 max-w-full" type="search" placeholder="Search name, phone, city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
          <select className="field !w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
            <option value="last">Ordered most recently</option><option value="spent">Spent the most</option><option value="orders">Most orders</option>
          </select>
        </div>
        {!orders ? <Skeleton /> : !shown.length ? <Empty title={customers.length ? "Nobody matches" : "No customers yet"} /> : (
          <>
            <div className="hidden grid-cols-[1.5fr_1fr_80px_110px_110px_100px] gap-4 border-b border-line bg-paper/60 px-4 py-2 text-xs font-medium text-muted md:grid">
              <span>Name</span><span>City</span><span className="text-right">Orders</span><span className="text-right">Spent</span><span className="text-right">To collect</span><span className="text-right">Last order</span>
            </div>
            <ul className="divide-y divide-line">
              {shown.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setOpenId(c.id)} className="grid w-full grid-cols-2 gap-x-4 gap-y-0.5 px-4 py-3 text-left text-sm hover:bg-paper lg:grid-cols-[1.5fr_1fr_80px_110px_110px_100px] lg:items-center">
                    <span className="min-w-0"><span className="block truncate font-medium">{c.name}</span><span className="block text-xs text-muted">{c.phone}</span></span>
                    <span className="text-right text-muted lg:text-left">{c.city || "—"}</span>
                    <span className="lg:text-right">{c.orders.length} order{c.orders.length === 1 ? "" : "s"}</span>
                    <span className="text-right font-medium">{rupees(c.spent)}</span>
                    <span className={`lg:text-right ${c.owed ? "text-maroon" : "text-muted"}`}>{c.owed ? rupees(c.owed) : "—"}</span>
                    <span className="text-right text-xs text-muted">{when(c.last)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ""}>
        {open && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line text-center">
              <div className="p-3"><p className="text-xs text-muted">Orders</p><p className="text-lg font-semibold">{open.orders.length}</p></div>
              <div className="p-3"><p className="text-xs text-muted">Spent</p><p className="text-lg font-semibold">{rupees(open.spent)}</p></div>
              <div className="p-3"><p className="text-xs text-muted">To collect</p><p className={`text-lg font-semibold ${open.owed ? "text-maroon" : ""}`}>{rupees(open.owed)}</p></div>
            </div>
            <div>
              {open.phone && <p className="flex gap-3"><a className="text-maroon hover:underline" href={`tel:${open.phone}`}>{open.phone}</a><a className="text-[#14713a] hover:underline" href={waLink(open.phone)} target="_blank" rel="noreferrer">WhatsApp</a></p>}
              {open.address && <p className="mt-1 text-muted">{open.address}</p>}
              <p className="mt-1 text-xs text-muted">Orders through {[...open.channels].map((s) => (s === "web" ? "the website" : "WhatsApp")).join(" and ")}</p>
            </div>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {open.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-paper">
                    <span className="w-24 font-semibold">{orderRef(o)}</span>
                    <span className="flex-1 text-xs text-muted">{new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                    <span className="font-medium">{rupees(o.total_paise)}</span>
                    <StatusPill status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Sheet>
    </div>
  );
}

