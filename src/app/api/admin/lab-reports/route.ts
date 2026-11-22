import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyUploadedObjectMagicBytes } from "@/lib/s3";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp } from "@/lib/security";

const createReportSchema = z.object({
  batchNo: z.string().trim().min(1).max(80),
  reportDate: z.string().min(4),
  labName: z.string().trim().min(2).max(160),
  fileUrl: z.string().url(),
  s3Key: z.string().optional().nullable(),
  fileMime: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  thumbnailUrl: z.string().url().optional().nullable(),
  thumbnailS3Key: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  if (d.s3Key) {
    const validMagic = await verifyUploadedObjectMagicBytes(d.s3Key, d.fileMime);
    if (!validMagic) {
      return NextResponse.json({ error: "Uploaded file signature does not match declared file type." }, { status: 400 });
    }
  }

  const report = await prisma.labReport.create({
    data: {
      batchNo: d.batchNo,
      reportDate: new Date(d.reportDate),
      labName: d.labName,
      fileUrl: d.fileUrl,
      s3Key: d.s3Key || null,
      fileMime: d.fileMime,
      thumbnailUrl: d.thumbnailUrl || (d.fileMime.startsWith("image/") ? d.fileUrl : null),
      thumbnailS3Key: d.thumbnailS3Key || null,
    },
  });

  await recordAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "CREATE_LAB_REPORT",
    entityType: "LabReport",
    entityId: report.id,
    afterSummary: { batchNo: report.batchNo, labName: report.labName },
    ip: getClientIp(req),
  });

  revalidatePath("/lab-reports");
  return NextResponse.json({ report }, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.labReport.delete({ where: { id } });
  await recordAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "DELETE_LAB_REPORT",
    entityType: "LabReport",
    entityId: id,
    ip: getClientIp(req),
  });
  revalidatePath("/lab-reports");
  return NextResponse.json({ ok: true });
}
