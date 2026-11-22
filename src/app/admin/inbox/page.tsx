import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminInboxPage() {
  const [submissions, orderQueries] = await Promise.all([
    prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.orderQuery.findMany({
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true } }, user: { select: { name: true, email: true } } },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-kadhai">Inbox</h1>

      <div className="panel p-6">
        <h2 className="text-lg font-bold text-kadhai">Contact &amp; Bulk Enquiries ({submissions.length})</h2>
        <div className="mt-4 space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-xl border border-line p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-bold text-kadhai">
                  [{s.type}] {s.firstName} {s.lastName}
                </p>
                <span className="text-xs text-muted">{new Date(s.createdAt).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-muted">Phone: {s.phone} {s.email && `• Email: ${s.email}`}</p>
              <p className="mt-2 text-ink/85">{s.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="text-lg font-bold text-kadhai">Customer Order Queries ({orderQueries.length})</h2>
        <div className="mt-4 space-y-3">
          {orderQueries.map((q) => (
            <div key={q.id} className="rounded-xl border border-line p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-bold text-kadhai">
                  {q.order.orderNumber}: {q.subject}
                </p>
                <span className="text-xs font-semibold text-maroon">{q.status}</span>
              </div>
              <p className="text-xs text-muted">{q.user.name} ({q.user.email})</p>
              <p className="mt-2 text-ink/85">{q.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
