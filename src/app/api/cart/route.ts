import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security";

const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.string().min(1),
      quantity: z.number().int().min(1).max(50),
    })
  ),
  mode: z.enum(["merge", "replace"]).default("merge"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
            },
          },
        },
      },
    },
  });

  if (!cart) return NextResponse.json({ items: [] });

  return NextResponse.json({
    items: cart.items.map((item) => ({
      variantId: item.variantId,
      productId: item.variant.productId,
      productSlug: item.variant.product.slug,
      productName: item.variant.product.name,
      variantLabel: item.variant.label,
      pricePaise: item.variant.pricePaise,
      mrpPaise: item.variant.mrpPaise,
      stockQty: item.variant.stockQty,
      imageUrl: item.variant.product.images[0]?.url ?? "/brand/photos/pack-cow.jpg",
      quantity: item.quantity,
    })),
  });
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = mergeCartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  }

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  if (parsed.data.mode === "replace") {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  for (const item of parsed.data.items) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant || !variant.active) continue;
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
    });
    const nextQty = Math.min(50, (existing?.quantity ?? 0) + item.quantity);
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
      create: { cartId: cart.id, variantId: item.variantId, quantity: Math.min(50, item.quantity) },
      update: { quantity: parsed.data.mode === "replace" ? Math.min(50, item.quantity) : nextQty },
    });
  }

  return GET();
}
