import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-kadhai">Audit Log</h1>
      <div className="panel overflow-x-auto p-5">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2">Time</th>
              <th className="py-2">Actor</th>
              <th className="py-2">Action</th>
              <th className="py-2">Entity</th>
              <th className="py-2">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="py-2 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                <td className="py-2">{l.actorEmail || "System"}</td>
                <td className="py-2 font-mono font-bold">{l.action}</td>
                <td className="py-2">{l.entityType} {l.entityId && `(${l.entityId.slice(0, 8)})`}</td>
                <td className="py-2 max-w-md truncate font-mono">{JSON.stringify(l.afterSummary || {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
