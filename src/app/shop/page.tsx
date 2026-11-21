"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard, ProductCardProps } from "@/components/ProductCard";

const CATEGORIES = [
  { label: "All Products", slug: "" },
  { label: "Cow Ghee", slug: "cow-ghee" },
  { label: "Buffalo Ghee", slug: "buffalo-ghee" },
  { label: "A2 Desi Cow Ghee", slug: "a2-desi-cow-ghee" },
  { label: "Groundnut Oil", slug: "groundnut-oil" },
];

const FILTERS = [
  { label: "All / Default", value: "all" },
  { label: "Featured", value: "featured" },
  { label: "Most Bought", value: "most_bought" },
  { label: "Fresh Arrivals", value: "fresh_arrivals" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function ShopAllPage() {
  const [products, setProducts] = useState<ProductCardProps["product"][]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    if (filter && filter !== "all") params.set("filter", filter);

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, [search, category, filter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-espresso/10 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-espresso">Shop All</h1>
          <p className="mt-1 text-sm text-taupe">Cow Ghee, Buffalo Ghee, A2 Desi Cow Ghee & Groundnut Oil</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or SKU..."
              className="w-full rounded-xl border border-espresso/20 bg-white py-2 pl-9 pr-3 text-sm focus:border-ghee focus:outline-none"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-espresso/20 bg-white px-3.5 py-2 text-sm font-medium text-espresso focus:border-ghee focus:outline-none"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              category === c.slug
                ? "bg-espresso text-cream"
                : "border border-espresso/15 bg-white text-espresso hover:bg-cream-soft"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-taupe">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-sm text-taupe">No products match your search or filter.</div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
