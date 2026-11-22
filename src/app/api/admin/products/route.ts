import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp, sanitizeRichHtml } from "@/lib/security";

const productActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("upsert_category"),
    id: z.string().optional(),
    slug: z.string().trim().min(2).max(80),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional().nullable(),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("upsert_product"),
    id: z.string().optional(),
    categoryId: z.string().min(1),
    slug: z.string().trim().min(2).max(120),
    name: z.string().trim().min(2).max(160),
    shortDescription: z.string().trim().max(500).optional().nullable(),
    richContent: z.string().max(15000).optional().nullable(),
    isFeatured: z.boolean().default(false),
    featuredOrder: z.number().int().default(0),
    isMostBought: z.boolean().default(false),
    mostBoughtOrder: z.number().int().default(0),
    isFreshArrival: z.boolean().default(false),
    freshArrivalOrder: z.number().int().default(0),
    active: z.boolean().default(true),
    imageUrls: z.array(z.string().min(1)).optional(),
  }),
  z.object({
    action: z.literal("update_product_images"),
    id: z.string().min(1),
    imageUrls: z.array(z.string().url()).max(20),
  }),
  z.object({
    action: z.literal("upsert_variant"),
    id: z.string().optional(),
    productId: z.string().min(1),
    label: z.string().trim().min(1).max(80),
    sku: z.string().trim().max(64).optional().nullable(),
    pricePaise: z.number().int().positive(),
    mrpPaise: z.number().int().positive(),
    stockQty: z.number().int().min(0),
    isPlaceholderPrice: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("confirm_all_prices"),
  }),
  z.object({
    action: z.literal("delete_variant"),
    id: z.string().min(1),
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = productActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const ip = getClientIp(req);

  try {
    if (data.action === "upsert_category") {
      const cat = data.id
        ? await prisma.category.update({
            where: { id: data.id },
            data: { slug: data.slug, name: data.name, description: data.description || null, sortOrder: data.sortOrder, active: data.active },
          })
        : await prisma.category.create({
            data: { slug: data.slug, name: data.name, description: data.description || null, sortOrder: data.sortOrder, active: data.active },
          });
      await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_CATEGORY", entityType: "Category", entityId: cat.id, afterSummary: cat, ip });
      revalidatePath("/");
      revalidatePath("/shop");
      return NextResponse.json({ category: cat });
    }

    if (data.action === "update_product_images") {
      const product = await prisma.product.findUnique({ where: { id: data.id } });
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      await prisma.$transaction(async (tx) => {
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        if (data.imageUrls.length) {
          await tx.productImage.createMany({ data: data.imageUrls.map((url, idx) => ({ productId: product.id, url, alt: product.name, sortOrder: idx })) });
        }
      });
      await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPDATE_PRODUCT_IMAGES", entityType: "Product", entityId: product.id, afterSummary: { imageCount: data.imageUrls.length }, ip });
      revalidatePath("/"); revalidatePath("/shop"); revalidatePath(`/product/${product.slug}`);
      return NextResponse.json({ ok: true, imageCount: data.imageUrls.length });
    }

    if (data.action === "upsert_product") {
      const cleanRich = data.richContent ? sanitizeRichHtml(data.richContent) : null;
      const product = data.id
        ? await prisma.product.update({
            where: { id: data.id },
            data: {
              categoryId: data.categoryId,
              slug: data.slug,
              name: data.name,
              shortDescription: data.shortDescription || null,
              richContent: cleanRich,
              isFeatured: data.isFeatured,
              featuredOrder: data.featuredOrder,
              isMostBought: data.isMostBought,
              mostBoughtOrder: data.mostBoughtOrder,
              isFreshArrival: data.isFreshArrival,
              freshArrivalOrder: data.freshArrivalOrder,
              active: data.active,
            },
          })
        : await prisma.product.create({
            data: {
              categoryId: data.categoryId,
              slug: data.slug,
              name: data.name,
              shortDescription: data.shortDescription || null,
              richContent: cleanRich,
              isFeatured: data.isFeatured,
              featuredOrder: data.featuredOrder,
              isMostBought: data.isMostBought,
              mostBoughtOrder: data.mostBoughtOrder,
              isFreshArrival: data.isFreshArrival,
              freshArrivalOrder: data.freshArrivalOrder,
              active: data.active,
            },
          });

      if (data.imageUrls && data.imageUrls.length > 0) {
        await prisma.productImage.deleteMany({ where: { productId: product.id } });
        await prisma.productImage.createMany({
          data: data.imageUrls.map((url, idx) => ({
            productId: product.id,
            url,
            alt: product.name,
            sortOrder: idx,
          })),
        });
      }

      await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_PRODUCT", entityType: "Product", entityId: product.id, afterSummary: { name: product.name, slug: product.slug }, ip });
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/ghee");
      revalidatePath("/groundnut-oil");
      revalidatePath(`/product/${product.slug}`);
      return NextResponse.json({ product });
    }

    if (data.action === "upsert_variant") {
      const cleanSku = data.sku && data.sku.trim() ? data.sku.trim() : null;
      const variant = data.id
        ? await prisma.productVariant.update({
            where: { id: data.id },
            data: {
              label: data.label,
              sku: cleanSku,
              pricePaise: data.pricePaise,
              mrpPaise: data.mrpPaise,
              stockQty: data.stockQty,
              isPlaceholderPrice: data.isPlaceholderPrice,
              sortOrder: data.sortOrder,
              active: data.active,
            },
          })
        : await prisma.productVariant.create({
            data: {
              productId: data.productId,
              label: data.label,
              sku: cleanSku,
              pricePaise: data.pricePaise,
              mrpPaise: data.mrpPaise,
              stockQty: data.stockQty,
              isPlaceholderPrice: data.isPlaceholderPrice,
              sortOrder: data.sortOrder,
              active: data.active,
            },
          });

      await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "UPSERT_VARIANT", entityType: "ProductVariant", entityId: variant.id, afterSummary: variant, ip });
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/ghee");
      return NextResponse.json({ variant });
    }

    if (data.action === "confirm_all_prices") {
      const updated = await prisma.productVariant.updateMany({
        where: { isPlaceholderPrice: true },
        data: { isPlaceholderPrice: false },
      });
      await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "CONFIRM_ALL_PRICES", entityType: "ProductVariant", afterSummary: { count: updated.count }, ip });
      return NextResponse.json({ confirmedCount: updated.count });
    }

    if (data.action === "delete_variant") {
      await prisma.productVariant.delete({ where: { id: data.id } });
      await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "DELETE_VARIANT", entityType: "ProductVariant", entityId: data.id, ip });
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Operation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
