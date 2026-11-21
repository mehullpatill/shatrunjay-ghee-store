"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap } from "lucide-react";
import { useCart } from "./CartContext";

export interface ProductCardProps {
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    priceInr: number;
    mrpInr: number | null;
    volumeLabel: string | null;
    imagesJson: unknown;
    availableStock: number;
    isFeatured?: boolean;
    isMostBought?: boolean;
    category?: { name: string; slug: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { updateItem, openDrawer } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const images = Array.isArray(product.imagesJson) ? (product.imagesJson as string[]) : [];
  const thumb = images[0];
  const discountPct =
    product.mrpInr && product.mrpInr > product.priceInr
      ? Math.round(((product.mrpInr - product.priceInr) / product.mrpInr) * 100)
      : 0;

  const handleAdd = async (buyNow = false) => {
    setLoading(true);
    setError(null);
    const err = await updateItem(product.id, 1, "increment");
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (buyNow) {
      router.push("/checkout");
    } else {
      openDrawer();
    }
  };

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-espresso/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-cream-soft">
          {thumb ? (
            <img
              src={thumb}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-cream-soft to-cream-warm text-espresso/50">
              <span className="font-serif text-lg font-semibold text-ghee-dark">{product.sku}</span>
              <span className="text-xs">{product.volumeLabel || "Pure Ghee"}</span>
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {product.isFeatured && (
              <span className="rounded-full bg-espresso px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                Featured
              </span>
            )}
            {product.isMostBought && (
              <span className="rounded-full bg-ghee px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Best Seller
              </span>
            )}
            {discountPct > 0 && (
              <span className="rounded-full bg-leaf px-2.5 py-0.5 text-[10px] font-semibold text-white">
                {discountPct}% OFF
              </span>
            )}
          </div>
        </Link>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-medium text-taupe">
            <span>{product.category?.name || "Shatrunjay"}</span>
            <span className={product.availableStock > 0 ? "text-leaf" : "text-red-600"}>
              {product.availableStock > 0 ? "IN STOCK" : "OUT OF STOCK"}
            </span>
          </div>
          <Link href={`/product/${product.slug}`} className="mt-1 block font-semibold text-espresso hover:text-ghee-dark line-clamp-2">
            {product.name}
          </Link>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-espresso">₹{product.priceInr.toLocaleString("en-IN")}</span>
            {product.mrpInr && product.mrpInr > product.priceInr && (
              <span className="text-xs text-taupe line-through">₹{product.mrpInr.toLocaleString("en-IN")}</span>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          disabled={loading || product.availableStock <= 0}
          onClick={() => handleAdd(false)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-espresso bg-white px-3 py-2 text-xs font-semibold text-espresso transition hover:bg-cream-soft disabled:opacity-50"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Add to Cart
        </button>
        <button
          disabled={loading || product.availableStock <= 0}
          onClick={() => handleAdd(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-espresso px-3 py-2 text-xs font-semibold text-cream transition hover:bg-espresso-light disabled:opacity-50"
        >
          <Zap className="h-3.5 w-3.5 text-ghee-light" />
          Buy Now
        </button>
      </div>
    </div>
  );
}
