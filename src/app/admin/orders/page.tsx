import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const status = (sp.status || "").trim();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { pincode: { contains: q } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-kadhai">Orders</h1>
        <form action="/admin/orders" method="GET" className="flex flex-wrap gap-2">
          <input type="search" name="q" defaultValue={q} placeholder="Order #, email, pincode..." className="field w-56" />
          <select name="status" defaultValue={status} className="field w-44">
            <option value="">All Statuses</option>
            {["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="btn">Filter</button>
        </form>
      </div>

      <div className="panel overflow-x-auto p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-2">Order #</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Pincode</th>
              <th className="py-2">Status</th>
              <th className="py-2">Payment</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="py-2.5 font-semibold">
                  <Link href={`/admin/orders/${o.id}`} className="text-maroon hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-2.5">{o.user.name} <span className="text-xs text-muted">({o.user.email})</span></td>
                <td className="py-2.5">{o.pincode} {o.isMumbai && <span className="text-xs text-label">(Mumbai)</span>}</td>
                <td className="py-2.5 text-xs font-semibold">{o.status}</td>
                <td className="py-2.5 text-xs">{o.paymentMethod} / {o.paymentStatus}</td>
                <td className="py-2.5 text-right font-bold">{formatRupees(o.totalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
