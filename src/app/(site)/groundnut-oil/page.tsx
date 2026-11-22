import type { Metadata } from "next";
import Link from "next/link";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Groundnut Oil" };
export const revalidate = 120;

export default async function GroundnutOilPage() {
  const [banner, category, proc] = await Promise.all([
    prisma.banner.findFirst({ where: { placement: "GROUNDNUT_STATIC", active: true } }),
    prisma.category.findUnique({
      where: { slug: "groundnut-oil" },
      include: {
        products: {
          where: { active: true },
          include: {
            category: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            variants: { where: { active: true }, orderBy: { sortOrder: "asc" }, take: 1 },
          },
        },
      },
    }),
    prisma.processBlock.findUnique({
      where: { key: "groundnut_oil_making" },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    }),
  ]);

  const cards: ProductCardData[] = (category?.products ?? [])
    .map((p) => {
      const v = p.variants[0];
      if (!v) return null;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        categoryName: category?.name || "Groundnut Oil",
        categorySlug: "groundnut-oil",
        imageUrl: p.images[0]?.url || "/brand/photos/kitchen.jpg",
        defaultVariant: v,
      };
    })
    .filter(Boolean) as ProductCardData[];

  return (
    <div>
      <section className="bg-label text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">{banner?.title || "Pure Groundnut Oil"}</h1>
            <p className="mt-4 max-w-xl text-white/85">
              {banner?.subtitle || "Traditionally pressed groundnut oil for wholesome everyday Indian cooking."}
            </p>
          </div>
          {banner?.imageUrl && (
            <img src={banner.imageUrl} alt={banner.title} className="aspect-video w-full rounded-3xl object-cover shadow-xl" />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        {cards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-line bg-butter p-8 text-center">
            <h2 className="text-xl font-bold text-kadhai">Groundnut Oil Launching Soon</h2>
            <p className="mt-2 text-sm text-muted">
              Our Groundnut Oil range (1L, 5L, 15L) is being stocked. Contact us for advance or bulk enquiries.
            </p>
            <Link href="/contact" className="btn mt-4">Enquire Now</Link>
          </div>
        )}

        {proc && (
          <div className="mt-14 grid gap-8 rounded-3xl border border-line bg-butter p-6 md:p-8 lg:grid-cols-2 lg:items-center">
            <div>
              {proc.videoUrl ? (
                <video src={proc.videoUrl} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black object-cover" />
              ) : (
                <img src="/brand/photos/kitchen.jpg" alt={proc.title} loading="lazy" className="aspect-video w-full rounded-2xl object-cover" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-kadhai">{proc.title}</h2>
              {proc.subtitle && <p className="mt-1 text-sm text-muted">{proc.subtitle}</p>}
              <ol className="mt-5 space-y-4">
                {proc.steps.slice(0, 9).map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kadhai text-xs font-bold text-ghee">
                      {step.stepOrder}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-kadhai">{step.heading}</p>
                      {step.subheading && <p className="text-xs text-muted">{step.subheading}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
