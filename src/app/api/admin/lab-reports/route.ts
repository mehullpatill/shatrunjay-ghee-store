import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const reports = await prisma.labReport.findMany({ orderBy: { reportDate: "desc" } });
    return NextResponse.json({ reports });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to fetch lab reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const report = await prisma.labReport.create({
      data: {
        batchNo: String(body.batchNo).trim(),
        reportDate: new Date(body.reportDate),
        labName: String(body.labName).trim(),
        fileUrl: String(body.fileUrl).trim(),
        thumbnailUrl: body.thumbnailUrl || null,
        fileType: body.fileType === "IMAGE" ? "IMAGE" : "PDF",
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to create lab report" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.labReport.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to delete lab report" }, { status: 500 });
  }
}
