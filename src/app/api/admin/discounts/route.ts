import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp } from "@/lib/security";

const discountSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_promo"),
    code: z.string().trim().min(2).max(40).transform((s) => s.toUpperCase()),
    description: z.string().max(250).optional().nullable(),
    discountType: z.enum(["FIXED", "PERCENT"]),
    discountValue: z.number().int().positive(),
    maxDiscountPaise: z.number().int().positive().optional().nullable(),
    minOrderPaise: z.number().int().min(0).default(0),
    showOnWebsite: z.boolean().default(false),
    bannerText: z.string().max(200).optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  }),
  z.object({
    action: z.literal("toggle_promo"),
    id: z.string().min(1),
    active: z.boolean(),
  }),
  z.object({
    action: z.literal("create_coupon"),
    code: z.string().trim().min(2).max(40).transform((s) => s.toUpperCase()),
    description: z.string().max(250).optional().nullable(),
    discountType: z.enum(["FIXED", "PERCENT"]),
    discountValue: z.number().int().positive(),
    maxDiscountPaise: z.number().int().positive().optional().nullable(),
    minOrderPaise: z.number().int().min(0).default(0),
    totalUsageLimit: z.number().int().positive().optional().nullable(),
    perUserLimit: z.number().int().min(1).default(1),
    startsAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  }),
  z.object({
    action: z.literal("toggle_coupon"),
    id: z.string().min(1),
    active: z.boolean(),
  }),
]);

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
  const parsed = discountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  const ip = getClientIp(req);

  if (d.action === "create_promo") {
    const promo = await prisma.promoCode.create({
      data: {
        code: d.code,
        description: d.description || null,
        discountType: d.discountType,
        discountValue: d.discountValue,
        maxDiscountPaise: d.maxDiscountPaise || null,
        minOrderPaise: d.minOrderPaise,
        showOnWebsite: d.showOnWebsite,
        bannerText: d.bannerText || null,
        usageLimit: d.usageLimit || null,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      },
    });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "CREATE_PROMO", entityType: "PromoCode", entityId: promo.id, afterSummary: promo, ip });
    return NextResponse.json({ promo }, { status: 201 });
  }

  if (d.action === "toggle_promo") {
    const promo = await prisma.promoCode.update({ where: { id: d.id }, data: { active: d.active } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "TOGGLE_PROMO", entityType: "PromoCode", entityId: promo.id, afterSummary: { active: d.active }, ip });
    return NextResponse.json({ promo });
  }

  if (d.action === "create_coupon") {
    const coupon = await prisma.couponCode.create({
      data: {
        code: d.code,
        description: d.description || null,
        discountType: d.discountType,
        discountValue: d.discountValue,
        maxDiscountPaise: d.maxDiscountPaise || null,
        minOrderPaise: d.minOrderPaise,
        totalUsageLimit: d.totalUsageLimit || null,
        perUserLimit: d.perUserLimit,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      },
    });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "CREATE_COUPON", entityType: "CouponCode", entityId: coupon.id, afterSummary: coupon, ip });
    return NextResponse.json({ coupon }, { status: 201 });
  }

  if (d.action === "toggle_coupon") {
    const coupon = await prisma.couponCode.update({ where: { id: d.id }, data: { active: d.active } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "TOGGLE_COUPON", entityType: "CouponCode", entityId: coupon.id, afterSummary: { active: d.active }, ip });
    return NextResponse.json({ coupon });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
