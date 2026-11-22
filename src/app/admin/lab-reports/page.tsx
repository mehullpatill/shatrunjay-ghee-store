import { prisma } from "@/lib/prisma";
import AdminLabReportsClient from "@/components/admin/AdminLabReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminLabReportsPage() {
  const reports = await prisma.labReport.findMany({ orderBy: { reportDate: "desc" } });
  return (
    <AdminLabReportsClient
      reports={reports.map((r) => ({
        id: r.id,
        batchNo: r.batchNo,
        reportDate: r.reportDate.toISOString(),
        labName: r.labName,
        fileUrl: r.fileUrl,
      }))}
    />
  );
}
