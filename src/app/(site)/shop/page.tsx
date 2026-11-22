import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/leadr";
import { FAMILIES, familyOf, litres, type Family } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shop ghee" };
const ORDER: Family[] = ["a2", "cow", "buffalo"];

export default async function Shop({ searchParams }: { searchParams: Promise<{ family?: string }> }) {
  const { family } = await searchParams;
  const active = ORDER.includes(family as Family) ? (family as Family) : null;
  const products = (await getProducts())
    .filter((p) => !active || familyOf(p.name) === active)
    .sort((a, b) => ORDER.indexOf(familyOf(a.name)) - ORDER.indexOf(familyOf(b.name)) || Number(b.in_stock) - Number(a.in_stock) || litres(a) - litres(b));
  const chip = (href: string, label: string, on: boolean) => (
    <Link key={href} href={href} aria-current={on ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${on ? "border-kadhai bg-kadhai text-white" : "border-line bg-white hover:border-kadhai/40"}`}>{label}</Link>
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="text-4xl font-bold text-kadhai">{active ? FAMILIES[active].name : "All ghee"}</h1>
      <p className="mt-2 max-w-xl text-muted">{active ? FAMILIES[active].line : "A2 Gir cow, pure cow and pure buffalo ghee, from 500 ml jars to 15 kg tins."}</p>
      <nav aria-label="Filter by ghee" className="mt-6 flex flex-wrap gap-2">
        {chip("/shop", "All", !active)}
        {ORDER.map((f) => chip(`/shop?family=${f}`, FAMILIES[f].name, active === f))}
      </nav>
      {products.length
        ? <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        : <p className="mt-10 text-muted">Nothing here right now. <Link href="/shop" className="font-semibold text-maroon">See all ghee</Link></p>}
    </div>
  );
}
