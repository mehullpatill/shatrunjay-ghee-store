import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pincodeRowSchema } from "@/lib/validators";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp } from "@/lib/security";

const singleSchema = z.object({
  action: z.literal("upsert"),
  ...pincodeRowSchema.shape,
});

const csvSchema = z.object({
  action: z.literal("bulk_csv"),
  csvText: z.string().min(6).max(500_000),
});

const deleteSchema = z.object({
  action: z.literal("delete"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
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
  const ip = getClientIp(req);

  const single = singleSchema.safeParse(body);
  if (single.success) {
    const d = single.data;
    const saved = await prisma.serviceablePincode.upsert({
      where: { pincode: d.pincode },
      create: { pincode: d.pincode, isMumbai: d.isMumbai, isCodAllowed: d.isCodAllowed, city: d.city || null, area: d.area || null },
      update: { isMumbai: d.isMumbai, isCodAllowed: d.isCodAllowed, city: d.city || null, area: d.area || null },
    });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_PINCODE", entityType: "ServiceablePincode", entityId: saved.pincode, afterSummary: saved, ip });
    return NextResponse.json({ pincode: saved });
  }

  const del = deleteSchema.safeParse(body);
  if (del.success) {
    await prisma.serviceablePincode.deleteMany({ where: { pincode: del.data.pincode } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "DELETE_PINCODE", entityType: "ServiceablePincode", entityId: del.data.pincode, ip });
    return NextResponse.json({ ok: true });
  }

  const csv = csvSchema.safeParse(body);
  if (csv.success) {
    const lines = csv.data.csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 10000) {
      return NextResponse.json({ error: "CSV exceeds 10,000 rows limit." }, { status: 400 });
    }
    const deduped = new Map<string, { pincode: string; isMumbai: boolean; isCodAllowed: boolean; city: string | null; area: string | null }>();
    for (const line of lines) {
      const cols = line.split(",").map((c) => c.trim());
      const pin = cols[0] || "";
      if (!/^[1-9][0-9]{5}$/.test(pin)) continue; // Skip header or invalid rows
      const isMumbai = ["1", "true", "yes", "y"].includes((cols[1] || "").toLowerCase());
      const isCodAllowed = ["1", "true", "yes", "y"].includes((cols[2] || "").toLowerCase());
      deduped.set(pin, {
        pincode: pin,
        isMumbai,
        isCodAllowed,
        city: cols[3] || null,
        area: cols[4] || null,
      });
    }

    let count = 0;
    for (const row of deduped.values()) {
      await prisma.serviceablePincode.upsert({
        where: { pincode: row.pincode },
        create: row,
        update: { isMumbai: row.isMumbai, isCodAllowed: row.isCodAllowed, city: row.city, area: row.area },
      });
      count++;
    }

    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "BULK_CSV_PINCODES", entityType: "ServiceablePincode", afterSummary: { imported: count }, ip });
    return NextResponse.json({ imported: count });
  }

  return NextResponse.json({ error: "Invalid pincode request" }, { status: 400 });
}
