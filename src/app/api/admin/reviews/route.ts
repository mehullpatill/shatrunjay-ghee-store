import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp } from "@/lib/security";

export async function GET() {
  try { await requireRole("ADMIN"); } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const reviews = await prisma.productReview.findMany({ include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ reviews });
}

export async function PATCH(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let admin;
  try { admin = await requireRole("ADMIN"); } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = z.object({ id: z.string().min(1), status: z.enum(["PENDING", "APPROVED", "REJECTED"]), adminNote: z.string().max(500).optional().nullable() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review update" }, { status: 400 });
  const review = await prisma.productReview.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status, adminNote: parsed.data.adminNote || null } });
  await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "MODERATE_PRODUCT_REVIEW", entityType: "ProductReview", entityId: review.id, afterSummary: { status: review.status }, ip: getClientIp(req) });
  return NextResponse.json({ review });
}
