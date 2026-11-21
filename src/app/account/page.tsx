"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, LogOut, MessageSquarePlus } from "lucide-react";

interface OrderRecord {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  totalInr: number;
  deliveryEtaText: string;
  courierName: string | null;
  trackingNumber: string | null;
  courierDispatchDate: string | null;
  courierImageUrl: string | null;
  createdAt: string;
  items: Array<{ id: string; productName: string; sku: string; quantity: number; lineTotalInr: number }>;
  queries: Array<{ id: string; subject: string; message: string; status: string; createdAt: string }>;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; referralCode: string } | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryOrderId, setQueryOrderId] = useState<string | null>(null);
  const [queryForm, setQueryForm] = useState({ subject: "", message: "" });
  const [queryMsg, setQueryMsg] = useState<string | null>(null);

  const loadOrders = async () => {
    const res = await fetch("/api/account/orders");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setUser(data.user || null);
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const submitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryOrderId) return;
    const res = await fetch(`/api/account/orders/${queryOrderId}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryForm),
    });
    if (res.ok) {
      setQueryMsg("Your query has been emailed to info@shatrunjayghee.com.");
      setQueryForm({ subject: "", message: "" });
      setQueryOrderId(null);
      loadOrders();
    }
  };

  if (loading) return <div className="py-20 text-center text-sm text-taupe">Loading your account...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-espresso/10 bg-white p-6 shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-espresso">Welcome, {user?.name}</h1>
          <p className="text-xs text-taupe">{user?.email} • Referral Code: <span className="font-mono font-semibold text-ghee-dark">{user?.referralCode}</span></p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-espresso/20 px-4 py-2 text-xs font-semibold text-espresso hover:bg-cream-soft"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </button>
      </div>

      {queryMsg && <div className="rounded-xl bg-leaf/10 p-3 text-xs font-semibold text-leaf">{queryMsg}</div>}

      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-espresso">Your Orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-taupe">You haven&apos;t placed any orders yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-espresso/10 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-espresso/10 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-ghee-dark" />
                  <span className="font-mono text-sm font-bold text-espresso">#{order.orderNumber}</span>
                  <span className="rounded-full bg-cream-warm px-2.5 py-0.5 text-[11px] font-semibold text-espresso">
                    {order.orderStatus}
                  </span>
                </div>
                <span className="text-sm font-bold text-espresso">₹{order.totalInr.toLocaleString("en-IN")}</span>
              </div>

              <div className="space-y-1 text-xs text-taupe">
                {order.items.map((item) => (
                  <p key={item.id}>
                    {item.productName} ({item.sku}) × {item.quantity} — ₹{item.lineTotalInr.toLocaleString("en-IN")}
                  </p>
                ))}
              </div>

              <div className="rounded-xl bg-cream-soft p-3 text-xs space-y-1">
                <p><strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})</p>
                <p><strong>Delivery Estimate:</strong> {order.deliveryEtaText}</p>
                {order.courierName && <p><strong>Courier:</strong> {order.courierName}</p>}
                {order.trackingNumber && <p><strong>Tracking Number:</strong> {order.trackingNumber}</p>}
                {order.courierImageUrl && (
                  <p>
                    <a href={order.courierImageUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ghee-dark underline">
                      View Dispatch Image / Receipt
                    </a>
                  </p>
                )}
              </div>

              <button
                onClick={() => setQueryOrderId(queryOrderId === order.id ? null : order.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ghee-dark hover:underline"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Raise a Query on this Order
              </button>

              {queryOrderId === order.id && (
                <form onSubmit={submitQuery} className="space-y-3 rounded-xl border border-espresso/15 p-4">
                  <input
                    required
                    placeholder="Subject"
                    value={queryForm.subject}
                    onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                    className="w-full rounded-lg border border-espresso/20 px-3 py-2 text-xs"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your query (sent directly to info@shatrunjayghee.com)"
                    value={queryForm.message}
                    onChange={(e) => setQueryForm({ ...queryForm, message: e.target.value })}
                    className="w-full rounded-lg border border-espresso/20 px-3 py-2 text-xs"
                  />
                  <button type="submit" className="rounded-lg bg-espresso px-4 py-2 text-xs font-semibold text-cream">
                    Send Query
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
