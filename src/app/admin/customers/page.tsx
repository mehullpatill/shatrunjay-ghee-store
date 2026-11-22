import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-kadhai">Customers ({customers.length})</h1>
      <div className="panel overflow-x-auto p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Verified</th>
              <th className="py-2">Referral Code</th>
              <th className="py-2 text-right">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 font-medium">{c.name}</td>
                <td className="py-2.5">{c.email}</td>
                <td className="py-2.5 text-xs">{c.emailVerifiedAt ? "Verified" : "Pending"}</td>
                <td className="py-2.5 font-mono text-xs">{c.referralCode}</td>
                <td className="py-2.5 text-right font-bold">{c._count.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
