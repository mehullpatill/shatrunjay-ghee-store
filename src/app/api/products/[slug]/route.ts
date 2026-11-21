import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableStock, releaseExpiredLocks } from "@/lib/cart-engine";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    await releaseExpiredLocks();
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: { category: true },
    });
    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const availableStock = await getAvailableStock(product.id);
    const settings = await prisma.siteSetting.findUnique({
      where: { id: "default" },
      select: { productFreeDeliveryText: true, productSafePackagingText: true },
    });
    return NextResponse.json({ product: { ...product, availableStock }, settings });
  } catch (err) {
    console.error("Product detail error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
