import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAdmin } from "@/lib/auth";
import { releaseExpiredLocks } from "@/lib/cart-engine";

export async function GET() {
  try {
    await requireAdmin();
    await releaseExpiredLocks();

    const carts = await prisma.cart.findMany({
      where: {
        status: { in: ["ABANDONED", "LOCKED", "ACTIVE"] },
        items: { some: {} },
      },
      include: {
        items: { include: { product: { select: { name: true, sku: true, priceInr: true } } } },
        locks: true,
      },
      orderBy: { lastActivityAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ carts });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to load carts" }, { status: 500 });
  }
}
