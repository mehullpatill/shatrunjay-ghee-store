import Link from "next/link";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { DropIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { getGoogleReviews } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export const revalidate = 120;

function toCardData(
  p: {
    id: string;
    slug: string;
    name: string;
    category: { name: string; slug: string };
    images: { url: string }[];
    variants: { id: string; label: string; pricePaise: number; mrpPaise: number; stockQty: number }[];
  }
): ProductCardData | null {
  const v = p.variants[0];
  if (!v) return null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    imageUrl: p.images[0]?.url || "/brand/photos/pack-cow.jpg",
    defaultVariant: v,
  };
}

export default async function HomePage() {
  const [banners, featuredRaw, mostBoughtRaw, freshRaw, gheeProcess, whySection, bulkSection, reels, reviewsData] =
    await Promise.all([
      prisma.banner.findMany({ where: { placement: "HOME_FLOATING", active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.product.findMany({
        where: { active: true, isFeatured: true },
        orderBy: { featuredOrder: "asc" },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { where: { active: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
        take: 8,
      }),
      prisma.product.findMany({
        where: { active: true, isMostBought: true },
        orderBy: { mostBoughtOrder: "asc" },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { where: { active: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
        take: 8,
      }),
      prisma.product.findMany({
        where: { active: true, isFreshArrival: true },
        orderBy: { freshArrivalOrder: "asc" },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { where: { active: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
        take: 8,
      }),
      prisma.processBlock.findUnique({
        where: { key: "home_ghee_making" },
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      }),
      prisma.siteSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "home", sectionKey: "why_shatrunjay" } } }),
      prisma.siteSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "home", sectionKey: "bulk_order" } } }),
      prisma.instagramReel.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
      getGoogleReviews(),
    ]);

  const hero = banners[0] ?? {
    title: "Ghee the way your grandmother made it",
    subtitle: "Desi cow milk, set into curd, churned by bilona and slowly simmered into golden, granular ghee.",
    imageUrl: "/brand/photos/gir-cows.jpg",
    ctaText: "Shop A2 Ghee",
    ctaLink: "/ghee#a2-desi-cow-ghee",
  };

  const featured = featuredRaw.map(toCardData).filter(Boolean) as ProductCardData[];
  const mostBought = mostBoughtRaw.map(toCardData).filter(Boolean) as ProductCardData[];
  const freshArrivals = freshRaw.map(toCardData).filter(Boolean) as ProductCardData[];

  return (
    <>
      {/* 1. Floating Hero Banners with CTAs */}
      <section className="overflow-hidden bg-butter">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-14">
          <div>
            <p className="font-display text-lg font-medium text-label">Shatrunjay Pure Ghee</p>
            <h1 className="mt-2 max-w-xl text-balance text-4xl font-extrabold leading-[1.06] text-kadhai md:text-6xl">
              {hero.title}
            </h1>
            {hero.subtitle && <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">{hero.subtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero.ctaLink || "/shop"} className="btn px-7 py-3.5 text-base">
                {hero.ctaText || "Shop Now"}
              </Link>
              <Link href="/our-story" className="btn-ghost px-6 py-3.5 text-base">
                Our Story
              </Link>
            </div>
            <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm text-ink/80">
              <li className="flex flex-col gap-1.5">
                <span className="text-label"><DropIcon /></span>
                Bilona churned, nothing added
              </li>
              <li className="flex flex-col gap-1.5">
                <span className="text-label"><ShieldIcon /></span>
                FSSAI &amp; Lab Tested
              </li>
              <li className="flex flex-col gap-1.5">
                <span className="text-label"><TruckIcon /></span>
                Free Home Delivery
              </li>
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <img
              src={hero.imageUrl}
              alt={hero.title}
              className="arch aspect-[4/5] w-full object-cover shadow-[0_30px_60px_-30px_rgba(36,21,15,0.55)]"
            />
            {banners.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {banners.slice(1).map((b) => (
                  <Link
                    key={b.id}
                    href={b.ctaLink || "/shop"}
                    className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm hover:border-maroon"
                  >
                    <img src={b.imageUrl} alt={b.title} className="h-12 w-12 rounded-xl object-cover" />
                    <div>
                      <p className="text-xs font-bold text-kadhai">{b.title}</p>
                      <span className="text-[11px] font-semibold text-maroon">{b.ctaText || "Explore →"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Featured Products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-kadhai md:text-4xl">Featured Products</h2>
            <Link href="/shop?sort=featured" className="text-sm font-semibold text-maroon hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* 3. Most Bought */}
      {mostBought.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-kadhai md:text-4xl">Most Bought</h2>
            <Link href="/shop?sort=most_bought" className="text-sm font-semibold text-maroon hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {mostBought.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* 4. Fresh Arrivals */}
      {freshArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-kadhai md:text-4xl">Fresh Arrivals</h2>
            <Link href="/shop?sort=fresh_arrivals" className="text-sm font-semibold text-maroon hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {freshArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* 5. Ghee Making: Half-width video + max 9 steps (heading only) */}
      <section className="mt-20 bg-kadhai text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            {gheeProcess?.videoUrl ? (
              <video
                src={gheeProcess.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full rounded-3xl bg-black object-cover shadow-xl"
              />
            ) : (
              <img
                src="/brand/photos/bilona-process.jpg"
                alt="Traditional Bilona Ghee Making Process"
                loading="lazy"
                className="w-full rounded-3xl object-cover shadow-xl"
              />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-ghee md:text-4xl">
              {gheeProcess?.title || "Ghee Making"}
            </h2>
            {gheeProcess?.subtitle && <p className="mt-2 text-white/75">{gheeProcess.subtitle}</p>}
            <ol className="mt-7 grid gap-3 sm:grid-cols-2">
              {(gheeProcess?.steps ?? []).slice(0, 9).map((step) => (
                <li key={step.id} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                  {step.imageUrl ? (
                    <img src={step.imageUrl} alt={step.heading} loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ghee text-sm font-bold text-ghee">
                      {step.stepOrder}
                    </span>
                  )}
                  <span>
                    <span className="block text-sm font-semibold text-white">{step.heading}</span>
                    {step.subheading && <span className="mt-0.5 block text-xs text-white/65">{step.subheading}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 6. Why Shatrunjay? */}
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <div className="rounded-3xl border border-line bg-butter p-8 md:p-12">
          <h2 className="text-3xl font-bold text-kadhai md:text-4xl">
            {whySection?.heading || "Why Shatrunjay?"}
          </h2>
          {whySection?.subheading && <p className="mt-2 text-lg text-muted">{whySection.subheading}</p>}
          {whySection?.content && (
            <div
              className="prose-shop mt-6 max-w-3xl text-ink/85 [&_ul]:grid [&_ul]:gap-3 [&_ul]:sm:grid-cols-2 [&_li]:rounded-2xl [&_li]:border [&_li]:border-line [&_li]:bg-white [&_li]:p-4"
              dangerouslySetInnerHTML={{ __html: whySection.content }}
            />
          )}
        </div>
      </section>

      {/* 7. What do our customers say? (Google Places API) */}
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-kadhai md:text-4xl">What do our customers say?</h2>
            <p className="mt-1 text-sm text-muted">
              Rated {reviewsData.rating.toFixed(1)} ★ across {reviewsData.total}+ Google Reviews
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {reviewsData.reviews.slice(0, 6).map((rev, idx) => (
            <article key={idx} className="flex flex-col rounded-3xl border border-line bg-white p-6">
              <div className="text-ghee text-sm">{"★".repeat(Math.round(rev.rating))}</div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/85">&ldquo;{rev.text}&rdquo;</p>
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                <span className="font-semibold text-kadhai">{rev.author_name}</span>
                <span>{rev.relative_time_description}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 8. Bulk Order CTA -> Wholesale */}
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <div className="grid overflow-hidden rounded-3xl bg-label text-white md:grid-cols-2">
          <div className="p-8 md:p-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              {bulkSection?.heading || "Bulk Order & Institutional Supply"}
            </h2>
            {bulkSection?.subheading && <p className="mt-3 text-white/85">{bulkSection.subheading}</p>}
            {bulkSection?.content && <p className="mt-3 text-sm text-white/75">{bulkSection.content}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/wholesale" className="rounded-full bg-ghee px-6 py-3 text-sm font-semibold text-kadhai hover:bg-[#ebb53d]">
                Enquire about bulk orders
              </Link>
              <Link href="/derasar" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10">
                Derasar Supply
              </Link>
            </div>
          </div>
          <div className="flex items-end justify-center bg-[#163a25] px-8 pt-10">
            <div className="arch w-full max-w-xs bg-butter p-6 pb-2">
              <img src="/brand/photos/pack-cow.jpg" alt="Bulk Pure Cow Ghee" loading="lazy" className="pack w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 9. Instagram Reels Thumbnail Grid */}
      {reels.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
          <h2 className="text-3xl font-bold text-kadhai md:text-4xl">Watch us on Instagram</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {reels.map((reel) => (
              <a
                key={reel.id}
                href={reel.reelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-butter"
              >
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.title || "Shatrunjay Ghee Reel"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                  ▶ Watch Reel
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
