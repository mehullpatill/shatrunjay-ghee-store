import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp } from "@/lib/security";

const ALLOWED_KEYS = [
  "whatsappEnabled",
  "whatsappNumber",
  "businessEmail",
  "googlePlaceId",
  "referralEnabled",
  "referralDiscountType",
  "referralDiscountValue",
  "referralMaxDiscountPaise",
  "tickerEnabled",
  "tickerMessages",
  "checkoutNotes",
  "policyVersion",
  "contactInfo",
  "socialLinks",
] as const;

const updateSettingsSchema = z.object({
  settings: z.record(z.enum(ALLOWED_KEYS), z.unknown()),
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
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  for (const [key, value] of Object.entries(parsed.data.settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }

  await recordAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "UPDATE_SITE_SETTINGS",
    entityType: "SiteSetting",
    afterSummary: Object.keys(parsed.data.settings),
    ip: getClientIp(req),
  });

  revalidateTag("site-settings");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
