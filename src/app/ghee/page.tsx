import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/cart-engine";
import { ProductCard } from "@/components/ProductCard";
import { MakingProcessBlock } from "@/components/MakingProcessBlock";

export const dynamic = "force-dynamic";

export default async function GheePage() {
  const [banners, products, makingSections] = await Promise.all([
    prisma.banner.findMany({ where: { pageKey: "GHEE_HERO", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true, category: { slug: { in: ["cow-ghee", "buffalo-ghee", "a2-desi-cow-ghee"] } } },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.makingProcessSection.findMany({
      where: { sectionKey: { in: ["COW_GHEE", "BUFFALO_GHEE", "A2_GHEE"] }, isActive: true },
    }),
  ]);

  const enriched = await Promise.all(
    products.map(async (p) => ({ ...p, availableStock: await getAvailableStock(p.id) }))
  );

  const cowGhee = enriched.filter((p) => p.category.slug === "cow-ghee");
  const buffaloGhee = enriched.filter((p) => p.category.slug === "buffalo-ghee");
  const a2Ghee = enriched.filter((p) => p.category.slug === "a2-desi-cow-ghee");

  const makingMap = Object.fromEntries(makingSections.map((m) => [m.sectionKey, m]));

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6">
      <section className="grid gap-4 md:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="relative overflow-hidden rounded-3xl bg-espresso p-6 text-cream shadow-md">
            {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />}
            <div className="relative z-10 space-y-3">
              <h2 className="font-serif text-2xl font-bold">{b.title}</h2>
              {b.subtitle && <p className="text-xs text-cream/80">{b.subtitle}</p>}
              {b.ctaUrl && (
                <Link
                  href={b.ctaUrl}
                  className="inline-block rounded-full bg-ghee px-4 py-2 text-xs font-bold text-white hover:bg-ghee-dark"
                >
                  {b.ctaLabel || "Explore"}
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>

      <section id="cow-ghee" className="space-y-8 scroll-mt-24">
        <div>
          <h2 className="font-serif text-3xl font-bold text-espresso">Cow Ghee</h2>
          <p className="text-sm text-taupe">Available in 500 ml, 1 L, 5 L, and 15 Kg</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cowGhee.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {makingMap.COW_GHEE && (
          <MakingProcessBlock
            title={makingMap.COW_GHEE.title}
            subtitle={makingMap.COW_GHEE.subtitle}
            videoUrl={makingMap.COW_GHEE.videoUrl}
            steps={Array.isArray(makingMap.COW_GHEE.stepsJson) ? (makingMap.COW_GHEE.stepsJson as Array<{ heading: string; subheading?: string }>) : []}
          />
        )}
      </section>

      <section id="buffalo-ghee" className="space-y-8 scroll-mt-24">
        <div>
          <h2 className="font-serif text-3xl font-bold text-espresso">Buffalo Ghee</h2>
          <p className="text-sm text-taupe">Available in 1 L, 5 L, and 15 Kg</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {buffaloGhee.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {makingMap.BUFFALO_GHEE && (
          <MakingProcessBlock
            title={makingMap.BUFFALO_GHEE.title}
            subtitle={makingMap.BUFFALO_GHEE.subtitle}
            videoUrl={makingMap.BUFFALO_GHEE.videoUrl}
            steps={Array.isArray(makingMap.BUFFALO_GHEE.stepsJson) ? (makingMap.BUFFALO_GHEE.stepsJson as Array<{ heading: string; subheading?: string }>) : []}
          />
        )}
      </section>

      <section id="a2-desi-cow-ghee" className="space-y-8 scroll-mt-24">
        <div>
          <h2 className="font-serif text-3xl font-bold text-espresso">A2 Desi Cow Ghee</h2>
          <p className="text-sm text-taupe">Available in 500 ml, 1 L, and 5 L</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {a2Ghee.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {makingMap.A2_GHEE && (
          <MakingProcessBlock
            title={makingMap.A2_GHEE.title}
            subtitle={makingMap.A2_GHEE.subtitle}
            videoUrl={makingMap.A2_GHEE.videoUrl}
            steps={Array.isArray(makingMap.A2_GHEE.stepsJson) ? (makingMap.A2_GHEE.stepsJson as Array<{ heading: string; subheading?: string }>) : []}
          />
        )}
      </section>
    </div>
  );
}
