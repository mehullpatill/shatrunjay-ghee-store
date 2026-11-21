import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAvailableStock } from "@/lib/cart-engine";
import { ProductCard } from "@/components/ProductCard";
import { MakingProcessBlock } from "@/components/MakingProcessBlock";
import { ShieldCheck, Truck, FlaskConical, Sparkles, Star, Play, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Truck,
  FlaskConical,
  Sparkles,
};

export default async function HomePage() {
  const [banners, products, homeMaking, whyItems, reels, settings] = await Promise.all([
    prisma.banner.findMany({ where: { pageKey: "HOME_HERO", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, include: { category: true }, orderBy: { sortOrder: "asc" } }),
    prisma.makingProcessSection.findUnique({ where: { sectionKey: "HOME_GHEE" } }),
    prisma.whyShatrunjayItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.instagramReel.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.siteSetting.findUnique({ where: { id: "default" } }),
  ]);

  const enriched = await Promise.all(
    products.map(async (p) => ({
      ...p,
      availableStock: await getAvailableStock(p.id),
    }))
  );

  const featured = enriched.filter((p) => p.isFeatured);
  const mostBought = enriched.filter((p) => p.isMostBought);
  const freshArrivals = enriched.filter((p) => p.isFreshArrival);

  let reviewsData: { rating: number; totalReviews: number; reviews: Array<{ authorName: string; rating: number; text: string; relativeTime: string }> } = {
    rating: 4.9,
    totalReviews: 0,
    reviews: [],
  };
  if (process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          process.env.GOOGLE_PLACE_ID
        )}&fields=rating,user_ratings_total,reviews&key=${encodeURIComponent(process.env.GOOGLE_PLACES_API_KEY)}`,
        { next: { revalidate: 3600 } }
      );
      const json = await res.json();
      if (json.status === "OK" && json.result) {
        reviewsData = {
          rating: json.result.rating ?? 4.9,
          totalReviews: json.result.user_ratings_total ?? 0,
          reviews: (json.result.reviews || []).map((r: Record<string, unknown>) => ({
            authorName: String(r.author_name || "Customer"),
            rating: Number(r.rating || 5),
            text: String(r.text || ""),
            relativeTime: String(r.relative_time_description || ""),
          })),
        };
      }
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-16 pb-8">
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`relative overflow-hidden rounded-3xl border border-espresso/10 bg-gradient-to-br from-espresso to-espresso-light p-8 text-cream shadow-lg ${
                idx === 0 && banners.length > 1 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              {b.imageUrl && (
                <img src={b.imageUrl} alt={b.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />
              )}
              <div className="relative z-10 flex h-full flex-col justify-between space-y-6">
                <div>
                  <span className="inline-block rounded-full bg-ghee/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ghee-light">
                    Shatrunjay Pure
                  </span>
                  <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-4xl">{b.title}</h1>
                  {b.subtitle && <p className="mt-2 max-w-md text-sm text-cream/80">{b.subtitle}</p>}
                </div>
                {b.ctaLabel && b.ctaUrl && (
                  <div>
                    <Link
                      href={b.ctaUrl}
                      className="inline-flex items-center gap-2 rounded-full bg-ghee px-5 py-2.5 text-xs font-bold text-white transition hover:bg-ghee-dark"
                    >
                      {b.ctaLabel}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ghee-dark">Handpicked</p>
              <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">Featured Products</h2>
            </div>
            <Link href="/shop?filter=featured" className="text-xs font-semibold text-espresso hover:text-ghee-dark">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {mostBought.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ghee-dark">Most Loved</p>
              <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">Most Bought</h2>
            </div>
            <Link href="/shop?filter=most_bought" className="text-xs font-semibold text-espresso hover:text-ghee-dark">
              See all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mostBought.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {freshArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ghee-dark">New In Store</p>
              <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">Fresh Arrivals</h2>
            </div>
            <Link href="/shop?filter=fresh_arrivals" className="text-xs font-semibold text-espresso hover:text-ghee-dark">
              See all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {freshArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {homeMaking && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <MakingProcessBlock
            title={homeMaking.title}
            subtitle={homeMaking.subtitle}
            videoUrl={homeMaking.videoUrl}
            steps={Array.isArray(homeMaking.stepsJson) ? (homeMaking.stepsJson as Array<{ heading: string }>) : []}
            headingOnly
          />
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">Why Shatrunjay?</h2>
          <p className="mt-1 text-sm text-taupe">Crafted with purity, verified by labs, delivered with care.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item) => {
            const Icon = ICON_MAP[item.iconName] || ShieldCheck;
            return (
              <div key={item.id} className="rounded-2xl border border-espresso/10 bg-white p-6 shadow-sm">
                <div className="inline-flex rounded-xl bg-ghee/15 p-3 text-ghee-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-espresso">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-taupe">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-espresso/10 bg-white p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-espresso/10 pb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">
                {settings?.googleReviewsTitle || "What do our customers say?"}
              </h2>
              <p className="mt-1 text-sm text-taupe">
                {settings?.googleReviewsSubtitle || "Verified Google Reviews from our patrons"}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-cream-soft px-4 py-2.5">
              <span className="text-2xl font-bold text-espresso">{reviewsData.rating.toFixed(1)}</span>
              <div>
                <div className="flex text-ghee">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-ghee" />
                  ))}
                </div>
                <p className="text-[11px] text-taupe">
                  {reviewsData.totalReviews > 0 ? `Based on ${reviewsData.totalReviews} Google reviews` : "Google Verified"}
                </p>
              </div>
            </div>
          </div>

          {reviewsData.reviews.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {reviewsData.reviews.slice(0, 6).map((rev, i) => (
                <div key={i} className="rounded-2xl border border-espresso/10 bg-cream-soft p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-espresso">{rev.authorName}</p>
                    <span className="text-[11px] text-taupe">{rev.relativeTime}</span>
                  </div>
                  <div className="mt-1 flex text-ghee">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-ghee" />
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-espresso/80 line-clamp-4">{rev.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-taupe">
              Add <code className="rounded bg-cream-soft px-1.5 py-0.5 text-xs">GOOGLE_PLACES_API_KEY</code> and{" "}
              <code className="rounded bg-cream-soft px-1.5 py-0.5 text-xs">GOOGLE_PLACE_ID</code> in{" "}
              <code className="rounded bg-cream-soft px-1.5 py-0.5 text-xs">.env</code> to display live Google Reviews.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-espresso p-8 text-cream md:flex-row md:items-center md:p-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-ghee-light">Bulk Orders</p>
            <h2 className="mt-2 font-serif text-2xl font-bold md:text-3xl">Planning a larger order?</h2>
            <p className="mt-2 text-sm text-cream/80">
              Tell us which products and quantities you need for your temple, social event, restaurant, or business.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/wholesale"
              className="rounded-full bg-ghee px-6 py-3 text-xs font-bold text-white transition hover:bg-ghee-dark"
            >
              Enquire about bulk orders
            </Link>
            <Link
              href="/shop"
              className="rounded-full border border-cream/30 px-6 py-3 text-xs font-semibold text-cream transition hover:bg-cream/10"
            >
              Browse products
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ghee-dark">Social</p>
            <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">Watch Our Reels</h2>
          </div>
          <a
            href={settings?.instagramUrl || "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-ghee-dark hover:underline"
          >
            Open Instagram →
          </a>
        </div>
        {reels.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {reels.map((reel) => (
              <a
                key={reel.id}
                href={reel.reelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[9/14] overflow-hidden rounded-2xl border border-espresso/10 bg-espresso"
              >
                {reel.thumbnailUrl ? (
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    className="h-full w-full object-cover opacity-85 transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-xs text-cream/70">
                    {reel.title}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-espresso shadow-lg">
                    <Play className="h-5 w-5 fill-espresso" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <a
            href={settings?.instagramUrl || "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-espresso/10 bg-white p-6 hover:border-ghee"
          >
            <span className="text-sm font-medium text-espresso">
              Follow Shatrunjay Ghee on Instagram for behind-the-scenes Bilona making & recipes.
            </span>
            <span className="rounded-full bg-ghee px-4 py-2 text-xs font-bold text-white">Open Instagram</span>
          </a>
        )}
      </section>
    </div>
  );
}
