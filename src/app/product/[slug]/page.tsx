"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Truck, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/components/CartContext";

interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  slug: string;
  priceInr: number;
  mrpInr: number | null;
  volumeLabel: string | null;
  shortDescription: string | null;
  description: string | null;
  belowAmountNote: string | null;
  imagesJson: string[];
  availableStock: number;
  category: { name: string };
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { updateItem, openDrawer } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [settings, setSettings] = useState<{ productFreeDeliveryText: string; productSafePackagingText: string } | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/products/${params.slug}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product || null);
        setSettings(d.settings || null);
      });
  }, [params.slug]);

  if (!product) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-taupe">Loading product...</div>;
  }

  const images = Array.isArray(product.imagesJson) ? product.imagesJson : [];

  const handleAction = async (buyNow: boolean) => {
    setError(null);
    const err = await updateItem(product.id, qty, "increment");
    if (err) {
      setError(err);
      return;
    }
    if (buyNow) router.push("/checkout");
    else openDrawer();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-espresso/10 bg-cream-soft aspect-square flex items-center justify-center">
          {images[0] ? (
            <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <p className="font-serif text-3xl font-bold text-ghee-dark">{product.sku}</p>
              <p className="mt-1 text-sm text-taupe">{product.volumeLabel}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ghee-dark">
              {product.category?.name} • SKU: {product.sku}
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold text-espresso">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-espresso">₹{product.priceInr.toLocaleString("en-IN")}</span>
            {product.mrpInr && product.mrpInr > product.priceInr && (
              <span className="text-sm text-taupe line-through">₹{product.mrpInr.toLocaleString("en-IN")}</span>
            )}
          </div>

          <div className="rounded-2xl border border-espresso/10 bg-white p-4 space-y-2">
            {product.belowAmountNote && <p className="text-xs font-medium text-espresso">{product.belowAmountNote}</p>}
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-leaf">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4" />
                {settings?.productFreeDeliveryText || "Free Home Delivery"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {settings?.productSafePackagingText || "Safe & Secure Packaging"}
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-espresso/85">{product.description || product.shortDescription}</p>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-espresso">Qty:</label>
            <input
              type="number"
              min={1}
              max={Math.max(1, product.availableStock)}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-xl border border-espresso/20 bg-white px-3 py-2 text-sm font-semibold"
            />
            <span className="text-xs text-taupe">{product.availableStock} available</span>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              disabled={product.availableStock <= 0}
              onClick={() => handleAction(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-espresso bg-white py-3 text-sm font-semibold text-espresso hover:bg-cream-soft disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>
            <button
              disabled={product.availableStock <= 0}
              onClick={() => handleAction(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-espresso py-3 text-sm font-semibold text-cream hover:bg-espresso-light disabled:opacity-50"
            >
              <Zap className="h-4 w-4 text-ghee-light" />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
