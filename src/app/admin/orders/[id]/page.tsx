import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/pricing";
import AdminOrderEditor from "@/components/admin/AdminOrderEditor";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();
  const addr = order.shippingAddressSnapshot as Record<string, string>;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-xs font-semibold text-maroon hover:underline">← Back to Orders</Link>

      <div className="panel p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-kadhai">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted">
              Customer: {order.user.name} ({order.user.email})
            </p>
            <p className="mt-1 text-xs text-muted">
              Address: {addr.recipientName}, {addr.line1}, {addr.city}, {addr.state} - {order.pincode} • Ph: {addr.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-maroon">{formatRupees(order.totalPaise)}</p>
            <p className="text-xs text-muted">{order.paymentMethod} • {order.paymentStatus}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-1.5">Product</th>
              <th className="py-1.5">Variant</th>
              <th className="py-1.5">SKU</th>
              <th className="py-1.5 text-right">Qty</th>
              <th className="py-1.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 font-medium">{item.productName}</td>
                <td className="py-2">{item.variantLabel}</td>
                <td className="py-2 font-mono text-xs">{item.sku || "—"}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right font-semibold">{formatRupees(item.lineTotalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminOrderEditor
        order={{
          id: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          courierName: order.courierName,
          trackingNumber: order.trackingNumber,
          courierImageUrl: order.courierImageUrl,
          cancelOrRefundNote: order.cancelOrRefundNote,
        }}
      />
    </div>
  );
}
