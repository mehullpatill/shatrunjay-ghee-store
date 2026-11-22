"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = { id: string; name: string; email: string; phone: string | null; role: string; referralCode: string };
type Order = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  totalInr: number;
  deliveryEtaText: string;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: { id: string; productName: string; quantity: number; lineTotalInr: number }[];
  queries: { id: string; subject: string; message: string; status: string; createdAt: string }[];
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  async function load() {
    const me = await fetch("/api/auth/me").then((r) => r.json());
    if (!me.user) {
      router.replace("/login?next=/account");
      return;
    }
    setUser(me.user);
    const ord = await fetch("/api/account/orders").then((r) => r.json());
    setOrders(ord.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function submitQuery(e: React.FormEvent, orderId: string) {
    e.preventDefault();
    setStatusMsg("");
    const r = await fetch(`/api/account/orders/${orderId}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    if (r.ok) {
      setSubject("");
      setMessage("");
      setActiveOrderId(null);
      setStatusMsg("Your query has been submitted. Our team will reply shortly.");
      load();
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-5 py-16 text-muted">Loading your account…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-kadhai">Namaste, {user?.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {user?.email} · Referral code: <strong className="text-kadhai">{user?.referralCode}</strong>
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="btn-outline !py-2 !px-4 text-sm">
              Admin panel
            </Link>
          )}
          <button onClick={logout} className="btn-outline !py-2 !px-4 text-sm">
            Sign out
          </button>
        </div>
      </div>

      {statusMsg && <p className="mt-6 rounded-2xl bg-butter px-4 py-3 text-sm font-medium text-label">{statusMsg}</p>}

      <h2 className="mt-10 font-display text-2xl font-bold text-kadhai">Your orders</h2>
      {!orders.length ? (
        <div className="mt-4 rounded-3xl bg-butter p-10 text-center text-muted">
          No orders yet.{" "}
          <Link href="/shop" className="font-semibold text-maroon">
            Shop Shatrunjay Ghee
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {orders.map((o) => (
            <div key={o.id} className="rounded-3xl border border-line bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="font-display text-lg font-bold text-kadhai">{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {o.deliveryEtaText}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-butter px-3 py-1 text-xs font-semibold text-kadhai">
                    {o.orderStatus} · {o.paymentMethod} ({o.paymentStatus})
                  </span>
                  <p className="mt-1 font-bold text-kadhai">₹{o.totalInr.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1 text-sm">
                {o.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>
                      {it.productName} × {it.quantity}
                    </span>
                    <span className="font-medium">₹{it.lineTotalInr.toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
              {o.courierName && (
                <p className="mt-3 text-xs text-label">
                  Dispatched via {o.courierName} {o.trackingNumber ? `· AWB: ${o.trackingNumber}` : ""}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3 pt-2">
                <Link href={`/track?order=${o.orderNumber}&phone=${encodeURIComponent(user?.phone || "")}`} className="text-sm font-semibold text-maroon">
                  Track status
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveOrderId(activeOrderId === o.id ? null : o.id)}
                  className="text-sm font-semibold text-kadhai underline"
                >
                  {activeOrderId === o.id ? "Close query form" : "Raise order query"}
                </button>
              </div>
              {activeOrderId === o.id && (
                <form onSubmit={(e) => submitQuery(e, o.id)} className="mt-4 space-y-3 rounded-2xl bg-butter p-4">
                  <input
                    required
                    placeholder="Subject (e.g. Delivery address update)"
                    className="field"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your question or issue…"
                    className="field"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button type="submit" className="btn !py-2 !px-4 text-sm">
                    Submit query
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
