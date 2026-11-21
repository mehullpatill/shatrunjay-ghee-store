import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ codes });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to fetch discount codes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const code = await prisma.discountCode.create({
      data: {
        code: String(body.code).trim().toUpperCase(),
        kind: body.kind || "PROMO",
        discountType: body.discountType || "PERCENT",
        value: Number(body.value),
        maxDiscountInr: body.maxDiscountInr ? Number(body.maxDiscountInr) : null,
        minOrderInr: Number(body.minOrderInr ?? 0),
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        showOnSite: Boolean(body.showOnSite),
        isActive: body.isActive !== false,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return NextResponse.json({ code }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to create discount code" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.discountCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to delete discount code" }, { status: 500 });
  }
}
