import React from "react";
import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/cart-engine";
import { ProductCard } from "@/components/ProductCard";
import { MakingProcessBlock } from "@/components/MakingProcessBlock";

export const dynamic = "force-dynamic";

export default async function GroundnutOilPage() {
  const [banner, products, making] = await Promise.all([
    prisma.banner.findFirst({ where: { pageKey: "GROUNDNUT_OIL", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true, category: { slug: "groundnut-oil" } },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.makingProcessSection.findUnique({ where: { sectionKey: "GROUNDNUT_OIL" } }),
  ]);

  const enriched = await Promise.all(
    products.map(async (p) => ({ ...p, availableStock: await getAvailableStock(p.id) }))
  );

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-espresso p-10 text-cream">
        {banner?.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{banner?.title || "Groundnut Oil"}</h1>
          {banner?.subtitle && <p className="mt-2 text-sm text-cream/80">{banner.subtitle}</p>}
        </div>
      </div>

      <section id="products" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {enriched.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </section>

      {making && (
        <MakingProcessBlock
          title={making.title}
          subtitle={making.subtitle}
          videoUrl={making.videoUrl}
          steps={Array.isArray(making.stepsJson) ? (making.stepsJson as Array<{ heading: string; subheading?: string }>) : []}
        />
      )}
    </div>
  );
}
