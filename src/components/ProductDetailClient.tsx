"use client";
import { useState } from "react";
import { useCart } from "./CartContext";
import { formatRupees } from "@/lib/pricing";
import { ShieldIcon, TruckIcon } from "./icons";

interface VariantInfo {
  id: string;
  label: string;
  pricePaise: number;
  mrpPaise: number;
  stockQty: number;
}

export default function ProductDetailClient({
  product,
  variants,
  primaryImage,
}: {
  product: { id: string; slug: string; name: string; richContent: string | null };
  variants: VariantInfo[];
  primaryImage: string;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [pincode, setPincode] = useState("");
  const [etaMsg, setEtaMsg] = useState<string | null>(null);
  const { addItem } = useCart();

  const selected = variants.find((v) => v.id === selectedId) || variants[0];
  if (!selected) return null;

  const checkEta = async () => {
    setEtaMsg(null);
    const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(pincode)}`);
    const data = (await res.json()) as { deliveryEtaText?: string; isCodAllowed?: boolean; error?: string };
    if (!res.ok) {
      setEtaMsg(data.error || "Enter a valid 6-digit pincode");
    } else {
      setEtaMsg(
        `Estimated delivery: ${data.deliveryEtaText}${data.isCodAllowed ? " • COD available" : " • Online payment (Razorpay)"}`
      );
    }
  };

  return (
    <div>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Select Pack Size</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                v.id === selected.id
                  ? "border-maroon bg-maroon text-white"
                  : "border-line bg-white text-kadhai hover:border-maroon"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-3xl font-extrabold text-kadhai">{formatRupees(selected.pricePaise)}</span>
        {selected.mrpPaise > selected.pricePaise && (
          <span className="text-base text-muted line-through">{formatRupees(selected.mrpPaise)}</span>
        )}
      </div>

      {product.richContent && (
        <div
          className="prose-shop mt-5 rounded-2xl border border-line bg-butter/60 p-4 text-sm leading-relaxed text-ink/85 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: product.richContent }}
        />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-line bg-white px-3 py-2">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 font-bold">
            −
          </button>
          <span className="min-w-[2rem] text-center text-sm font-semibold">{qty}</span>
          <button type="button" onClick={() => setQty(Math.min(50, selected.stockQty, qty + 1))} disabled={qty >= Math.min(50, selected.stockQty)} className="px-2 font-bold disabled:opacity-40">
            +
          </button>
        </div>
        <button
          type="button"
          disabled={selected.stockQty <= 0 || qty > selected.stockQty}
          onClick={() =>
            addItem(
              {
                variantId: selected.id,
                productId: product.id,
                productSlug: product.slug,
                productName: product.name,
                variantLabel: selected.label,
                pricePaise: selected.pricePaise,
                mrpPaise: selected.mrpPaise,
                imageUrl: primaryImage,
              },
              qty
            )
          }
          className="btn flex-1 py-3.5 text-base"
        >
          {selected.stockQty > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>

      {selected.stockQty > 0 && selected.stockQty <= 10 && (
        <p className="mt-2 text-xs font-medium text-maroon">Only {selected.stockQty} left in stock</p>
      )}

      {/* Required Product Badges */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white p-3 text-sm font-semibold text-label">
          <TruckIcon size={20} />
          <span>Free Home Delivery</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white p-3 text-sm font-semibold text-label">
          <ShieldIcon size={20} />
          <span>Safe &amp; Secure Packaging</span>
        </div>
      </div>

      {/* Pincode ETA check */}
      <div className="mt-6 rounded-2xl border border-line bg-white p-4">
        <p className="text-xs font-semibold text-muted">Check Delivery Estimate &amp; COD Availability</p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit pincode"
            className="field flex-1"
          />
          <button type="button" onClick={checkEta} className="btn-ghost">
            Check
          </button>
        </div>
        {etaMsg && <p className="mt-2 text-xs font-medium text-kadhai">{etaMsg}</p>}
      </div>
    </div>
  );
}
