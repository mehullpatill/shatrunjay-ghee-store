import Link from "next/link";
import type { Product } from "@/lib/leadr";
import { FAMILIES, familyOf } from "@/lib/catalog";
import { rupees } from "@/lib/format";
import QuickAdd from "./QuickAdd";

export default function ProductCard({ p }: { p: Product }) {
  const fam = FAMILIES[familyOf(p.name)];
  const low = p.in_stock && p.stock_qty !== null && p.stock_qty <= 5;
  return (
    <article className="group relative flex flex-col">
      <Link href={`/product/${p.id}`} className="relative block aspect-square overflow-hidden rounded-2xl bg-butter">
        <img src={p.image_url || fam.pack} alt={p.name} loading="lazy" className={`h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04] pack ${p.in_stock ? "" : "opacity-50 grayscale"}`} />
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: fam.tone, color: fam.ink }}>{fam.short}</span>
        {!p.in_stock && <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/95 py-1 text-center text-xs font-semibold text-maroon">Out of stock</span>}
      </Link>
      <div className="flex flex-1 flex-col pt-3">
        <Link href={`/product/${p.id}`} className="font-semibold leading-snug hover:text-maroon">{p.name}</Link>
        {(p.pack_label || low) && <p className="mt-0.5 text-sm text-muted">{p.pack_label}{low && <span className={`font-medium text-[#8a5a00] ${p.pack_label ? "ml-2" : ""}`}>Only {p.stock_qty} left</span>}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-bold text-ink">{rupees(p.price_paise)}</span>
          {p.in_stock && <QuickAdd id={p.id} name={p.name} />}
        </div>
      </div>
    </article>
  );
}
