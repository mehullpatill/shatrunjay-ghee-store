import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/pricing";
import OrderQueryForm from "@/components/OrderQueryForm";

export const metadata: Metadata = { title: "Order Details" };
export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      queries: { orderBy: { createdAt: "desc" } },
      shipment: { include: { events: { orderBy: { createdAt: "desc" } } } },
    },
  });

  if (!order || order.userId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 space-y-8">
      <div>
        <Link href="/account" className="text-xs font-semibold text-maroon hover:underline">← Back to My Account</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-kadhai">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted">
              Status: <strong className="text-kadhai">{order.status.replace(/_/g, " ")}</strong> •{" "}
              Payment: <strong>{order.paymentMethod} ({order.paymentStatus})</strong>
            </p>
          </div>
          <p className="text-2xl font-extrabold text-maroon">{formatRupees(order.totalPaise)}</p>
        </div>
      </div>

      {/* Courier & Tracking */}
      {(order.courierName || order.trackingNumber || order.courierImageUrl || order.shipment) && (
        <div className="rounded-3xl border border-line bg-butter p-6">
          <h2 className="text-lg font-bold text-kadhai">Courier &amp; Tracking Details</h2>
          <div className="mt-2 space-y-1 text-sm">
            {order.courierName && <p><strong>Courier:</strong> {order.courierName}</p>}
            {order.trackingNumber && <p><strong>Tracking Number:</strong> {order.trackingNumber}</p>}
            {order.shipment?.status && <p><strong>Shipment Status:</strong> {order.shipment.status.replace(/_/g, " ")}</p>}
            {order.shipment?.trackingUrl && <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon hover:underline">Track shipment online →</a>}
            {order.courierDate && (
              <p><strong>Dispatch Date:</strong> {new Date(order.courierDate).toLocaleDateString("en-IN")}</p>
            )}
          </div>
          {order.courierImageUrl && (
            <a href={order.courierImageUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <img src={order.courierImageUrl} alt="Courier dispatch receipt" className="max-h-48 rounded-2xl border border-line" />
            </a>
          )}
        </div>
      )}

      {/* Items */}
      <div className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-kadhai">Items</h2>
        <div className="mt-4 divide-y divide-line">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-semibold text-kadhai">{item.productName}</p>
                <p className="text-xs text-muted">{item.variantLabel} × {item.quantity}</p>
              </div>
              <p className="font-bold">{formatRupees(item.lineTotalPaise)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-kadhai">Order Timeline</h2>
        <ol className="mt-4 space-y-3">
          {order.statusHistory.map((h) => (
            <li key={h.id} className="border-l-2 border-ghee pl-4">
              <p className="text-sm font-bold text-kadhai">{h.status.replace(/_/g, " ")}</p>
              {h.note && <p className="text-xs text-muted">{h.note}</p>}
              <p className="text-[11px] text-muted">{new Date(h.createdAt).toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Raise a query */}
      <OrderQueryForm orderId={order.id} />

      {order.queries.length > 0 && (
        <div className="rounded-3xl border border-line bg-white p-6">
          <h3 className="text-lg font-bold text-kadhai">Your Queries on this Order</h3>
          <div className="mt-3 space-y-3">
            {order.queries.map((q) => (
              <div key={q.id} className="rounded-2xl bg-paper p-4 text-sm">
                <p className="font-bold text-kadhai">{q.subject} <span className="ml-2 text-xs text-muted">({q.status})</span></p>
                <p className="mt-1 text-ink/80">{q.message}</p>
                {q.adminReply && <p className="mt-2 text-xs font-semibold text-label">Reply: {q.adminReply}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
