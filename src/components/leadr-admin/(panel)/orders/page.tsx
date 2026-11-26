"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/adminApi";
import { rupees } from "@/lib/format";
import type { Order } from "../types";
import { Empty, ErrorLine, PageHeader, Sheet, Skeleton, SourceTag, StatusPill, customerName, customerPhone, due, orderRef, when } from "../ui";
import OrderDetail from "./OrderDetail";

const TABS: [string, string][] = [
  ["all", "All"], ["pending", "New"], ["payment_pending", "Awaiting payment"], ["confirmed", "Confirmed"], ["processing", "Packing"],
  ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"], ["help", "Asked for a person"],
];
const PAGE = 100;

export default function Orders() {
  const { data: orders, error } = useApi<Order[]>("orders");
  // Deep links from the overview: ?status=pending, ?open=<order id>.
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("status") ?? "all");
  const [source, setSource] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(params.get("open"));

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    orders?.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; if (o.needs_human_help) c.help = (c.help ?? 0) + 1; });
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (orders ?? []).filter((o) =>
      (tab === "all" || (tab === "help" ? o.needs_human_help : o.status === tab)) &&
      (!source || o.source === source) &&
      (!needle || [orderRef(o), customerName(o), customerPhone(o), o.shipping_address?.pincode, o.shipping_address?.city].some((v) => v?.toLowerCase().includes(needle))));
  }, [orders, tab, source, q]);

  const open = orders?.find((o) => o.id === openId) ?? null;

  return (
    <div>
      <PageHeader title="Orders" sub="WhatsApp and website orders in one list.">
        <a className="btn-ghost" href={`/admin/api/leadr/orders/export${source ? `?source=${source}` : ""}`}>Download CSV</a>
      </PageHeader>
      <ErrorLine msg={error} />

      <div className="panel">
        <div className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-2" role="tablist">
          {TABS.filter(([k]) => k === "all" || k === "pending" || counts[k]).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setLimit(PAGE); }}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === k ? "border-maroon font-semibold text-maroon" : "border-transparent text-muted hover:text-ink"}`}>
              {l}{counts[k] ? <span className="ml-1.5 text-xs text-muted">{counts[k]}</span> : null}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
          <input className="field !w-72 max-w-full" type="search" placeholder="Search name, phone, order no., PIN" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
          <select className="field !w-auto" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Channel">
            <option value="">WhatsApp and website</option><option value="whatsapp">WhatsApp only</option><option value="web">Website only</option>
          </select>
        </div>

        {!orders ? <Skeleton /> : !shown.length ? (
          <Empty title={orders.length ? "No orders match" : "No orders yet"}>{orders.length ? "Try another tab or clear the search." : "Orders from WhatsApp and the website land here."}</Empty>
        ) : (
          <>
            <div className="hidden grid-cols-[110px_1.4fr_1.6fr_100px_100px_150px_80px] gap-4 border-b border-line bg-paper/60 px-4 py-2 text-xs font-medium text-muted lg:grid">
              <span>Order</span><span>Customer</span><span>Items</span><span className="text-right">Total</span><span className="text-right">To collect</span><span>Status</span><span className="text-right">Placed</span>
            </div>
            <ul className="divide-y divide-line">
              {shown.slice(0, limit).map((o) => (
                <li key={o.id}>
                  <button onClick={() => setOpenId(o.id)} className={`grid w-full grid-cols-2 gap-x-4 gap-y-1 px-4 py-3 text-left text-sm hover:bg-paper lg:grid-cols-[110px_1.4fr_1.6fr_100px_100px_150px_80px] lg:items-center ${openId === o.id ? "bg-ghee-soft/60" : ""}`}>
                    <span className="font-semibold">{orderRef(o)}<span className="mt-0.5 block"><SourceTag source={o.source} /></span></span>
                    <span className="min-w-0 text-right lg:text-left">
                      <span className="block truncate font-medium">{customerName(o)}{o.needs_human_help && <span title="Asked to talk to a person" className="ml-1.5 text-maroon">●</span>}</span>
                      <span className="block text-xs text-muted">{customerPhone(o)}{o.shipping_address?.city ? `, ${o.shipping_address.city}` : ""}</span>
                    </span>
                    <span className="col-span-2 truncate text-muted lg:col-span-1">{o.items.map((i) => `${i.product_name} × ${i.quantity}`).join(", ")}</span>
                    <span className="font-medium lg:text-right">{rupees(o.total_paise)}</span>
                    <span className={`text-right ${due(o) && o.status !== "cancelled" ? "text-maroon" : "text-muted"}`}>{o.status === "cancelled" ? "—" : due(o) ? rupees(due(o)) : "Paid"}</span>
                    <span><StatusPill status={o.status} /></span>
                    <span className="text-right text-xs text-muted">{when(o.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {shown.length > limit && <div className="border-t border-line p-3 text-center"><button className="btn-ghost" onClick={() => setLimit(limit + PAGE)}>Show {Math.min(PAGE, shown.length - limit)} more</button></div>}
          </>
        )}
      </div>

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open ? `Order ${orderRef(open)}` : ""} wide>
        {open && <OrderDetail key={open.id} order={open} />}
      </Sheet>
    </div>
  );
}

