import { prisma } from "./prisma";
import { getEnv } from "./env";
import { getLeadrProducts, type LeadrProduct } from "./leadr";

export type CommerceVariant = {
  id: string;
  label: string;
  pricePaise: number;
  mrpPaise: number;
  stockQty: number;
};

export type CommerceProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  richContent: string | null;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  variants: CommerceVariant[];
};

function categoryForName(name: string): { name: string; slug: string } {
  const value = name.toLowerCase();
  if (value.includes("groundnut") || value.includes("oil")) return { name: "Groundnut Oil", slug: "groundnut-oil" };
  if (value.includes("buffalo")) return { name: "Buffalo Ghee", slug: "buffalo-ghee" };
  if (value.includes("a2") || value.includes("gir")) return { name: "A2 Desi Cow Ghee", slug: "a2-desi-cow-ghee" };
  return { name: "Cow Ghee", slug: "cow-ghee" };
}

function packLabel(product: LeadrProduct): string {
  if (product.pack_label) return product.pack_label;
  const match = product.name.match(/(500\s*ml|1\s*L(?:itre)?|5\s*L(?:itres)?|15\s*Kg(?:\s*\([^)]*\))?)/i);
  return match?.[1] ?? "Standard pack";
}

function fromLeadr(product: LeadrProduct): CommerceProduct {
  const category = categoryForName(product.name);
  return {
    id: product.id,
    slug: product.id,
    name: product.name,
    shortDescription: product.description || null,
    richContent: product.description || null,
    categoryName: category.name,
    categorySlug: category.slug,
    imageUrl: product.image_url || "/brand/photos/pack-cow.jpg",
    variants: [{
      id: product.id,
      label: packLabel(product),
      pricePaise: product.price_paise,
      // Leadr's storefront contract exposes the selling price only.
      mrpPaise: product.price_paise,
      stockQty: product.stock_qty ?? (product.in_stock ? 999 : 0),
    }],
  };
}

export async function getCommerceProducts(): Promise<CommerceProduct[]> {
  if (getEnv().COMMERCE_BACKEND === "leadr") {
    return (await getLeadrProducts()).map(fromLeadr);
  }

  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    richContent: product.richContent,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    imageUrl: product.images[0]?.url || "/brand/photos/pack-cow.jpg",
    variants: product.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      pricePaise: variant.pricePaise,
      mrpPaise: variant.mrpPaise,
      stockQty: variant.stockQty,
    })),
  }));
}

export async function getCommerceProduct(slug: string): Promise<CommerceProduct | null> {
  const products = await getCommerceProducts();
  return products.find((product) => product.slug === slug) ?? null;
}
