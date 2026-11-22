import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import { DropIcon, ShieldIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { getContent, waLink } from "@/lib/content";
import { getProducts } from "@/lib/leadr";
import { FAMILIES, familyOf, litres, sizeOf } from "@/lib/catalog";
import { rupees } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = (await getProducts()).find((x) => x.id === id);
  return { title: p?.name ?? "Ghee" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [products, { content, site }] = await Promise.all([getProducts(), getContent()]);
  const p = products.find((x) => x.id === id);
  if (!p) notFound();
  const f = familyOf(p.name);
  const fam = FAMILIES[f];
  const sizes = products.filter((x) => familyOf(x.name) === f).sort((a, b) => litres(a) - litres(b));
  const low = p.in_stock && p.stock_qty !== null && p.stock_qty <= 5;
  const delivery = site?.delivery_time_text || "Free delivery across Mumbai in 2–3 days.";
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-maroon">Shop</Link><span className="mx-2">/</span>
        <Link href={`/shop?family=${f}`} className="hover:text-maroon">{fam.name}</Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-3xl bg-butter lg:max-w-none">
          <img src={p.image_url || fam.pack} alt={p.name} className={`pack h-full w-full object-contain p-8 ${p.in_stock ? "" : "opacity-50 grayscale"}`} />
          <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: fam.tone, color: fam.ink }}>{fam.short}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight text-kadhai md:text-4xl">{p.name}</h1>
          <p className="mt-4 text-3xl font-bold text-ink">{rupees(p.price_paise)}</p>

          {sizes.length > 1 && (
            <fieldset className="mt-7">
              <legend className="mb-2 text-sm font-semibold">Size</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <Link key={s.id} href={`/product/${s.id}`} aria-current={s.id === p.id ? "page" : undefined}
                    className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${s.id === p.id ? "border-kadhai bg-kadhai text-white" : "border-line bg-white hover:border-kadhai/40"} ${s.in_stock ? "" : "text-muted line-through"}`}>
                    <span className="block font-semibold">{sizeOf(s) || s.name}</span>
                    <span className={`text-xs ${s.id === p.id ? "text-white/75" : "text-muted"}`}>{rupees(s.price_paise)}</span>
                  </Link>
                ))}
              </div>
            </fieldset>
          )}

          <p className={`mt-6 text-sm font-semibold ${p.in_stock ? (low ? "text-[#8a5a00]" : "text-leaf") : "text-maroon"}`}>{p.in_stock ? (low ? `Only ${p.stock_qty} left` : "In stock, ready to ship") : "Out of stock right now"}</p>
          <div className="mt-3"><AddToCart id={p.id} disabled={!p.in_stock} /></div>
          {content.phone && (
            <a href={waLink(content.phone, `Hi, I'd like to order ${p.name}`)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#14803c] hover:underline">
              <WhatsAppIcon size={18} />Prefer to order on WhatsApp?
            </a>
          )}

          <ul className="mt-8 grid gap-4 border-y border-line py-6 text-sm sm:grid-cols-3">
            <li className="flex gap-3 sm:flex-col sm:gap-1.5"><span className="text-label"><TruckIcon /></span>{delivery}</li>
            <li className="flex gap-3 sm:flex-col sm:gap-1.5"><span className="text-label"><ShieldIcon /></span>Cash on delivery or UPI / card</li>
            <li className="flex gap-3 sm:flex-col sm:gap-1.5"><span className="text-label"><DropIcon /></span>{f === "a2" ? "Bilona method, small batches" : "Hygienically packed"}</li>
          </ul>

          {p.description && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-kadhai">About this ghee</h2>
              <div className="prose-shop mt-2 leading-relaxed text-ink/80">{p.description.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
