import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/security";

/** GET  /api/account/addresses  — list all addresses for authenticated user */
export async function GET() {
  try {
    const user = await requireRole();
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ addresses });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** POST  /api/account/addresses  — create a new address */
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const user = await requireRole();

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid address" }, { status: 400 });
    }

    const address = await prisma.$transaction(async (tx) => {
      // Enforce the limit inside the same transaction as the insert.
      const count = await tx.address.count({ where: { userId: user.id } });
      if (count >= 10) throw new Error("ADDRESS_LIMIT");

      const makeDefault = count === 0 || parsed.data.isDefault;
      if (makeDefault) {
        await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      }

      return tx.address.create({
        data: {
          ...parsed.data,
          isDefault: makeDefault,
          line2: parsed.data.line2 || null,
          userId: user.id,
        },
      });
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof Error && err.message === "ADDRESS_LIMIT") {
      return NextResponse.json({ error: "You can save at most 10 addresses. Please delete one first." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}

/** PATCH  /api/account/addresses?id=<id>  — update an existing address */
export async function PATCH(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const user = await requireRole();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing address id" }, { status: 400 });

    // Confirm ownership
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid address" }, { status: 400 });
    }

    const address = await prisma.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id, NOT: { id } }, data: { isDefault: false } });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...parsed.data,
          line2: parsed.data.line2 || null,
        },
      });
    });
    return NextResponse.json({ address });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

/** DELETE  /api/account/addresses?id=<id>  — remove an address */
export async function DELETE(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const user = await requireRole();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing address id" }, { status: 400 });
    const deleted = await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!existing) return false;
      await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const replacement = await tx.address.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });
        if (replacement) await tx.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
      return true;
    });
    if (!deleted) return NextResponse.json({ error: "Address not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
