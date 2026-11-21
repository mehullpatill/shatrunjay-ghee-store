import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableStock, releaseExpiredLocks } from "@/lib/cart-engine";

export async function GET(req: Request) {
  try {
    await releaseExpiredLocks();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const filter = searchParams.get("filter")?.trim() || "featured";

    const where: Record<string, unknown> = { isActive: true };
    if (category) {
      where.category = { slug: category };
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filter === "featured") where.isFeatured = true;
    if (filter === "most_bought") where.isMostBought = true;
    if (filter === "fresh_arrivals") where.isFreshArrival = true;

    let orderBy: Record<string, "asc" | "desc"> = { sortOrder: "asc" };
    if (filter === "price_asc") orderBy = { priceInr: "asc" };
    if (filter === "price_desc") orderBy = { priceInr: "desc" };

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy,
    });

    const enriched = await Promise.all(
      products.map(async (p) => ({
        ...p,
        availableStock: await getAvailableStock(p.id),
      }))
    );

    return NextResponse.json({ products: enriched });
  } catch (err) {
    console.error("Products list error:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
