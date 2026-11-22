"use client";
import Link from "next/link";
import { useCart } from "./CartContext";
import { formatRupees } from "@/lib/pricing";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  defaultVariant: {
    id: string;
    label: string;
    pricePaise: number;
    mrpPaise: number;
    stockQty: number;
  };
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const v = product.defaultVariant;
  const inStock = v.stockQty > 0;
  const lowStock = inStock && v.stockQty <= 5;
  const discountPct =
    v.mrpPaise > v.pricePaise
      ? Math.round(((v.mrpPaise - v.pricePaise) / v.mrpPaise) * 100)
      : 0;

  return (
    <article className="group flex flex-col rounded-3xl border border-line bg-white p-3.5 transition-shadow hover:shadow-lg">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-butter"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04] pack ${
            inStock ? "" : "opacity-50 grayscale"
          }`}
        />
        <span className="absolute left-3 top-3 rounded-full bg-kadhai/90 px-2.5 py-1 text-[11px] font-semibold text-ghee">
          {product.categoryName}
        </span>
        {discountPct > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-label px-2 py-0.5 text-[11px] font-semibold text-white">
            {discountPct}% OFF
          </span>
        )}
        {!inStock && (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/95 py-1 text-center text-xs font-semibold text-maroon">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        <Link href={`/product/${product.slug}`} className="font-semibold leading-snug text-kadhai hover:text-maroon">
          {product.name}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          {v.label}
          {lowStock && <span className="ml-2 font-medium text-maroon">Only {v.stockQty} left</span>}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div>
            <span className="text-base font-bold text-ink">{formatRupees(v.pricePaise)}</span>
            {v.mrpPaise > v.pricePaise && (
              <span className="ml-1.5 text-xs text-muted line-through">{formatRupees(v.mrpPaise)}</span>
            )}
          </div>
          {inStock && (
            <button
              type="button"
              onClick={() =>
                addItem({
                  variantId: v.id,
                  productId: product.id,
                  productSlug: product.slug,
                  productName: product.name,
                  variantLabel: v.label,
                  pricePaise: v.pricePaise,
                  mrpPaise: v.mrpPaise,
                  imageUrl: product.imageUrl,
                })
              }
              className="rounded-full bg-maroon px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-maroon-dark"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
