import Link from "next/link";
import type { Metadata } from "next";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Shop All" };
export const dynamic = "force-dynamic";

export default async function ShopAllPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const categorySlug = (sp.category || "").trim();
  const sort = sp.sort || "all";
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const pageSize = 12;

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const where: Record<string, unknown> = { active: true };
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
    ];
  }
  if (sort === "featured") where.isFeatured = true;
  if (sort === "most_bought") where.isMostBought = true;
  if (sort === "fresh_arrivals") where.isFreshArrival = true;

  const [totalCount, productsRaw] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { active: true }, orderBy: { pricePaise: "asc" } },
      },
      orderBy:
        sort === "featured"
          ? { featuredOrder: "asc" }
          : sort === "most_bought"
          ? { mostBoughtOrder: "asc" }
          : sort === "fresh_arrivals"
          ? { freshArrivalOrder: "asc" }
          : { createdAt: "desc" },
      ...(sort === "price_asc" || sort === "price_desc"
        ? {}
        : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
  ]);

  // If filter (e.g. featured) returned 0 when no sort was explicitly chosen, fallback to all active
  let cards: ProductCardData[] = productsRaw
    .map((p) => {
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
    })
    .filter(Boolean) as ProductCardData[];

  if (sort === "price_asc") cards = [...cards].sort((a, b) => a.defaultVariant.pricePaise - b.defaultVariant.pricePaise);
  if (sort === "price_desc") cards = [...cards].sort((a, b) => b.defaultVariant.pricePaise - a.defaultVariant.pricePaise);
  if (sort === "price_asc" || sort === "price_desc") cards = cards.slice((page - 1) * pageSize, page * pageSize);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-kadhai md:text-5xl">Shop All</h1>
          <p className="mt-2 text-muted">Pure Cow Ghee, Buffalo Ghee, A2 Desi Cow Ghee &amp; Groundnut Oil.</p>
        </div>

        <form action="/shop" method="GET" className="flex flex-wrap items-center gap-2">
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products..."
            className="field w-56 sm:w-64"
          />
          <select name="sort" defaultValue={sort} className="field w-48">
            <option value="all">All Products</option>
            <option value="featured">Featured</option>
            <option value="most_bought">Most Bought</option>
            <option value="fresh_arrivals">Fresh Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button type="submit" className="btn">Apply</button>
        </form>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/shop?sort=all${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !categorySlug ? "bg-kadhai text-ghee" : "border border-line bg-white text-ink hover:border-maroon"
          }`}
        >
          All Categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}&sort=all${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              categorySlug === c.slug
                ? "bg-kadhai text-ghee"
                : "border border-line bg-white text-ink hover:border-maroon"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-line bg-butter p-10 text-center">
          <p className="text-lg font-semibold text-kadhai">No products matched your filter.</p>
          <Link href="/shop?sort=all" className="btn mt-4">
            Reset Filters
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/shop?page=${n}&sort=${sort}${categorySlug ? `&category=${categorySlug}` : ""}${
                q ? `&q=${encodeURIComponent(q)}` : ""
              }`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                n === page ? "bg-maroon text-white" : "border border-line bg-white text-ink"
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
