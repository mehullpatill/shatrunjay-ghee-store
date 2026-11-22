import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content";

export const metadata: Metadata = { title: "Our story" };

export default async function About() {
  const { content } = await getContent();
  return (
    <>
      <section className="bg-butter">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-kadhai md:text-5xl">A Mumbai family kitchen, making ghee the slow way</h1>
            <div className="prose-shop mt-6 text-lg leading-relaxed text-ink/80">{content.about.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>
            <Link href="/shop" className="btn mt-8">Shop our ghee</Link>
          </div>
          <img src="/brand/photos/gir-cows.jpg" alt="Desi cows outside a village home" className="arch mx-auto aspect-[4/5] w-full max-w-md object-cover" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pt-20 md:px-6 lg:grid-cols-2 lg:items-center">
        <img src="/brand/photos/a2-benefits.jpg" alt="Shatrunjay A2 ghee and what goes into it" loading="lazy" className="w-full rounded-3xl object-cover" />
        <div>
          <h2 className="text-3xl font-bold text-kadhai">Why A2 bilona ghee</h2>
          <p className="mt-4 leading-relaxed text-ink/80">Milk from desi cows carries the A2 type of protein. We set it into curd, churn the curd into makkhan with a bilona, and simmer the makkhan slowly until it turns into golden, granular ghee.</p>
          <p className="mt-3 leading-relaxed text-ink/80">It is the way ghee was made at home for generations, and it gives a rich aroma and an authentic taste you notice the moment you open the jar.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <dl className="grid gap-6 rounded-3xl border border-line bg-white p-8 sm:grid-cols-3">
          <div><dt className="text-sm text-muted">Company</dt><dd className="mt-1 font-semibold">Shatrunjay Foodstuffs Pvt Ltd</dd></div>
          {content.fssai && <div><dt className="text-sm text-muted">FSSAI licence</dt><dd className="mt-1 font-semibold tabular-nums">{content.fssai}</dd></div>}
          {content.gstin && <div><dt className="text-sm text-muted">GSTIN</dt><dd className="mt-1 font-semibold tabular-nums">{content.gstin}</dd></div>}
        </dl>
      </section>
    </>
  );
}
