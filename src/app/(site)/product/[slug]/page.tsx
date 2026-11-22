import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "@/components/ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.shortDescription || product.name,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product || product.variants.length === 0) notFound();
  const primaryImage = product.images[0]?.url || "/brand/photos/pack-cow.jpg";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav className="mb-6 text-xs text-muted">
        <Link href="/shop" className="hover:text-maroon">Shop All</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${product.category.slug}&sort=all`} className="hover:text-maroon">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-kadhai">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-butter p-8">
            <img src={primaryImage} alt={product.name} className="pack h-full w-full object-contain" />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img) => (
                <div key={img.id} className="aspect-square overflow-hidden rounded-2xl border border-line bg-butter p-2">
                  <img src={img.url} alt={img.alt || product.name} className="h-full w-full object-cover rounded-xl" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="inline-block rounded-full bg-butter px-3 py-1 text-xs font-semibold text-label">
            {product.category.name}
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-kadhai md:text-4xl">{product.name}</h1>
          {product.shortDescription && <p className="mt-2 text-muted">{product.shortDescription}</p>}
          <ProductDetailClient
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              richContent: product.richContent,
            }}
            variants={product.variants}
            primaryImage={primaryImage}
          />
        </div>
      </div>
    </div>
  );
}
