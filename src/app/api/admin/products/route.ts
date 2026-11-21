import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ include: { category: true }, orderBy: { sortOrder: "asc" } }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    return NextResponse.json({ products, categories });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        sku: String(body.sku).trim().toUpperCase(),
        name: String(body.name).trim(),
        slug: String(body.slug).trim().toLowerCase(),
        categoryId: body.categoryId,
        priceInr: Number(body.priceInr) || 0,
        mrpInr: body.mrpInr ? Number(body.mrpInr) : null,
        volumeLabel: body.volumeLabel || null,
        shortDescription: body.shortDescription || null,
        description: body.description || null,
        belowAmountNote: body.belowAmountNote || null,
        imagesJson: Array.isArray(body.imagesJson) ? body.imagesJson : [],
        stockQty: Number(body.stockQty ?? 100),
        isFeatured: Boolean(body.isFeatured),
        isMostBought: Boolean(body.isMostBought),
        isFreshArrival: Boolean(body.isFreshArrival),
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Create product error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const product = await prisma.product.update({
      where: { id: body.id },
      data: {
        ...(body.sku !== undefined ? { sku: String(body.sku).trim().toUpperCase() } : {}),
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.slug !== undefined ? { slug: String(body.slug).trim().toLowerCase() } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.priceInr !== undefined ? { priceInr: Number(body.priceInr) } : {}),
        ...(body.mrpInr !== undefined ? { mrpInr: body.mrpInr ? Number(body.mrpInr) : null } : {}),
        ...(body.volumeLabel !== undefined ? { volumeLabel: body.volumeLabel } : {}),
        ...(body.shortDescription !== undefined ? { shortDescription: body.shortDescription } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.belowAmountNote !== undefined ? { belowAmountNote: body.belowAmountNote } : {}),
        ...(body.imagesJson !== undefined ? { imagesJson: body.imagesJson } : {}),
        ...(body.stockQty !== undefined ? { stockQty: Number(body.stockQty) } : {}),
        ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
        ...(body.isMostBought !== undefined ? { isMostBought: Boolean(body.isMostBought) } : {}),
        ...(body.isFreshArrival !== undefined ? { isFreshArrival: Boolean(body.isFreshArrival) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
      },
    });
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
