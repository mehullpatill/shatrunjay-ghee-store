import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/pricing";
import { getEnv } from "@/lib/env";
import LeadrOverview from "@/components/leadr-admin/(panel)/page";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (getEnv().COMMERCE_BACKEND === "leadr") return <LeadrOverview />;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [ordersToday, totalRevenueAgg, pendingOrders, lowStockVariants, placeholderCount, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalPaise: true },
      }),
      prisma.order.count({ where: { status: { in: ["PLACED", "CONFIRMED", "PACKED"] } } }),
      prisma.productVariant.count({ where: { active: true, stockQty: { lte: 10 } } }),
      prisma.productVariant.count({ where: { isPlaceholderPrice: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

  const totalRevenuePaise = totalRevenueAgg._sum.totalPaise ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-kadhai">Admin Dashboard</h1>

      {placeholderCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-400 bg-amber-50 p-4 text-amber-950">
          <div>
            <p className="font-bold">Placeholder prices, review before launch</p>
            <p className="text-xs">
              {placeholderCount} product variant(s) currently use generated placeholder prices. Review and confirm them in Products before going live.
            </p>
          </div>
          <Link href="/admin/products" className="btn bg-amber-700 hover:bg-amber-800 text-xs">
            Review Prices
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <p className="text-xs font-medium text-muted">Orders Today</p>
          <p className="mt-2 text-3xl font-extrabold text-kadhai">{ordersToday}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-medium text-muted">Paid Revenue</p>
          <p className="mt-2 text-3xl font-extrabold text-label">{formatRupees(totalRevenuePaise)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-medium text-muted">Pending Fulfillment</p>
          <p className="mt-2 text-3xl font-extrabold text-maroon">{pendingOrders}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-medium text-muted">Low Stock Variants (≤10)</p>
          <p className="mt-2 text-3xl font-extrabold text-kadhai">{lowStockVariants}</p>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-kadhai">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-maroon hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="py-2">Order</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Status</th>
                <th className="py-2">Payment</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5 font-semibold">
                    <Link href={`/admin/orders/${o.id}`} className="text-maroon hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2.5">{o.user.name}</td>
                  <td className="py-2.5 text-xs">{o.status}</td>
                  <td className="py-2.5 text-xs">{o.paymentMethod} ({o.paymentStatus})</td>
                  <td className="py-2.5 text-right font-bold">{formatRupees(o.totalPaise)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
