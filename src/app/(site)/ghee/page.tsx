import type { Metadata } from "next";
import Link from "next/link";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Ghee" };
export const revalidate = 120;

const GHEE_CATEGORY_CONFIG = [
  { slug: "cow-ghee", bannerPlacement: "GHEE_COW", processKey: "ghee_cow_making" },
  { slug: "buffalo-ghee", bannerPlacement: "GHEE_BUFFALO", processKey: "ghee_buffalo_making" },
  { slug: "a2-desi-cow-ghee", bannerPlacement: "GHEE_A2", processKey: "ghee_a2_making" },
];

export default async function GheePage() {
  const [banners, categories, processBlocks] = await Promise.all([
    prisma.banner.findMany({
      where: { placement: { in: ["GHEE_COW", "GHEE_BUFFALO", "GHEE_A2"] }, active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { slug: { in: ["cow-ghee", "buffalo-ghee", "a2-desi-cow-ghee"] }, active: true },
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
      orderBy: { sortOrder: "asc" },
    }),
    prisma.processBlock.findMany({
      where: { key: { in: ["ghee_cow_making", "ghee_buffalo_making", "ghee_a2_making"] } },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c]));
  const procMap = new Map(processBlocks.map((b) => [b.key, b]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-extrabold text-kadhai md:text-5xl">Pure Ghee Collection</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Explore our Cow Ghee, Buffalo Ghee, and Bilona A2 Desi Cow Ghee — each crafted in small batches.
      </p>

      {/* 3 Floating Banners with CTA scrolling to section */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {banners.map((b) => (
          <a
            key={b.id}
            href={b.ctaLink || "#cow-ghee"}
            className="group flex items-center gap-4 rounded-3xl border border-line bg-butter p-5 transition-shadow hover:shadow-md"
          >
            <img src={b.imageUrl} alt={b.title} className="h-20 w-20 rounded-2xl bg-white object-contain p-2 pack" />
            <div>
              <h2 className="text-lg font-bold text-kadhai group-hover:text-maroon">{b.title}</h2>
              {b.subtitle && <p className="mt-0.5 text-xs text-muted">{b.subtitle}</p>}
              <span className="mt-2 inline-block text-xs font-semibold text-maroon">
                {b.ctaText || "Jump to section ↓"}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Category Sections + Ghee Making Process */}
      <div className="mt-16 space-y-20">
        {GHEE_CATEGORY_CONFIG.map((cfg) => {
          const cat = catMap.get(cfg.slug);
          if (!cat) return null;
          const proc = procMap.get(cfg.processKey);
          const cards: ProductCardData[] = cat.products
            .map((p) => {
              const v = p.variants[0];
              if (!v) return null;
              return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                categoryName: cat.name,
                categorySlug: cat.slug,
                imageUrl: p.images[0]?.url || "/brand/photos/pack-cow.jpg",
                defaultVariant: v,
              };
            })
            .filter(Boolean) as ProductCardData[];

          return (
            <section key={cat.id} id={cat.slug} className="scroll-mt-24">
              <div className="border-b border-line pb-4">
                <h2 className="text-3xl font-bold text-kadhai">{cat.name}</h2>
                {cat.description && <p className="mt-1 text-muted">{cat.description}</p>}
              </div>

              {cards.length > 0 ? (
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {cards.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted">Products coming soon. <Link href="/contact" className="text-maroon underline">Contact us</Link> for availability.</p>
              )}

              {/* Ghee Making Process Block */}
              {proc && (
                <div className="mt-10 grid gap-8 rounded-3xl border border-line bg-butter p-6 md:p-8 lg:grid-cols-2 lg:items-center">
                  <div>
                    {proc.videoUrl ? (
                      <video
                        src={proc.videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="aspect-video w-full rounded-2xl bg-black object-cover"
                      />
                    ) : (
                      <img
                        src="/brand/photos/bilona-process.jpg"
                        alt={proc.title}
                        loading="lazy"
                        className="aspect-video w-full rounded-2xl object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-kadhai">{proc.title}</h3>
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
            </section>
          );
        })}
      </div>
    </div>
  );
}
