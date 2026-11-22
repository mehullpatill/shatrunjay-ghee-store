import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { DropIcon, ShieldIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { getContent, waLink } from "@/lib/content";
import { getProducts } from "@/lib/leadr";
import { FAMILIES, familyOf, type Family } from "@/lib/catalog";
import { rupees } from "@/lib/format";

const STEPS: [string, string][] = [
  ["Milk is set into curd", "Whole milk from desi cows is boiled and left to set into curd."],
  ["Curd is churned by bilona", "The curd is churned until the makkhan separates from the buttermilk."],
  ["Makkhan is simmered slowly", "The butter cooks on a low flame until it turns golden and fragrant."],
  ["Packed in small batches", "Each batch is filtered and hygienically packed so it reaches you fresh."],
];
const USES: [string, string, string][] = [
  ["/brand/photos/paratha.jpg", "Rotis and parathas", "A spoon on a hot roti, the way it was always served."],
  ["/brand/photos/kitchen.jpg", "Everyday cooking", "Tadka, khichdi and dal with a high smoke point."],
  ["/brand/photos/baby-massage.jpg", "Abhyanga and baby massage", "Warm ghee for a gentle oil massage."],
  ["/brand/photos/buffalo-spoon.jpg", "Sweets and festive cooking", "Thick buffalo ghee for halwa, laddoo and mohanthal."],
];

export default async function Home() {
  const [{ content }, products] = await Promise.all([getContent(), getProducts()]);
  const live = products.filter((p) => p.in_stock);
  const from = (f: Family) => Math.min(...live.filter((p) => familyOf(p.name) === f).map((p) => p.price_paise));
  const order: Family[] = ["a2", "cow", "buffalo"];
  const featured = [...live].sort((a, b) => order.indexOf(familyOf(a.name)) - order.indexOf(familyOf(b.name))).slice(0, 8);
  const wa = content.phone ? waLink(content.phone, "Hi, I'd like to order Shatrunjay ghee") : "";

  return (
    <>
      <section className="overflow-hidden bg-butter">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-14">
          <div>
            <p className="font-display text-lg font-medium text-label">Shatrunjay A2 Gir Cow Ghee</p>
            <h1 className="mt-2 max-w-xl text-balance text-[2.6rem] font-extrabold leading-[1.05] text-kadhai md:text-6xl">{content.hero_title}</h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/80">{content.hero_subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop?family=a2" className="btn px-7 py-3.5 text-base">Shop A2 ghee</Link>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-kadhai/20 bg-white px-6 py-3.5 text-base font-semibold text-kadhai hover:border-kadhai/50"><span className="text-[#1fa855]"><WhatsAppIcon /></span>Order on WhatsApp</a>}
            </div>
            <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm text-ink/80">
              <li className="flex flex-col gap-1.5"><span className="text-label"><DropIcon /></span>Bilona churned, nothing added</li>
              <li className="flex flex-col gap-1.5"><span className="text-label"><ShieldIcon /></span>FSSAI licensed kitchen</li>
              <li className="flex flex-col gap-1.5"><span className="text-label"><TruckIcon /></span>Free Mumbai delivery in 2–3 days</li>
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <img src="/brand/photos/gir-cows.jpg" alt="Gir cows outside a village home" className="arch aspect-[4/5] w-full object-cover shadow-[0_30px_60px_-30px_rgba(36,21,15,0.55)]" />
            <div className="absolute -bottom-6 -left-4 w-36 rounded-3xl bg-white p-2 shadow-xl sm:w-44 lg:-left-10">
              <div className="rounded-2xl bg-butter"><img src="/brand/photos/pack-a2.jpg" alt="Shatrunjay A2 Gir Cow Ghee jar" className="pack aspect-square w-full object-contain p-2" /></div>
              <p className="px-1 pb-1 pt-2 text-center text-xs font-semibold text-label">A2 Gir Cow Ghee</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <h2 className="text-3xl font-bold text-kadhai md:text-4xl">Choose your ghee</h2>
        <p className="mt-2 max-w-xl text-muted">Three ghees, each in its own jar colour, so you can tell them apart in the kitchen.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {order.map((f) => {
            const fam = FAMILIES[f];
            const min = from(f);
            return (
              <Link key={f} href={`/shop?family=${f}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition-shadow hover:shadow-lg">
                <div className="relative aspect-[5/4] bg-butter">
                  <div className="absolute inset-x-0 bottom-0 h-2" style={{ background: fam.tone }} />
                  <img src={fam.pack} alt={fam.name} loading="lazy" className="pack h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.04]" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-bold text-kadhai">{fam.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{fam.line}</p>
                  <p className="mt-auto pt-4 text-sm font-semibold text-maroon">{Number.isFinite(min) ? `From ${rupees(min)}` : "See sizes"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold text-kadhai md:text-4xl">Popular in Mumbai homes</h2>
          <Link href="/shop" className="shrink-0 text-sm font-semibold text-maroon hover:underline">See all ghee</Link>
        </div>
        {featured.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          : <p className="text-muted">Our shelves are being restocked. {wa && <a href={wa} className="font-semibold text-maroon">WhatsApp us</a>} to order meanwhile.</p>}
      </section>

      <section className="mt-24 bg-kadhai text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <img src="/brand/photos/bilona-process.jpg" alt="Traditional bilona ghee process: milking, heating, setting curd, churning, makkhan, simmering" loading="lazy" className="mx-auto w-full max-w-md rounded-3xl" />
          <div>
            <h2 className="text-3xl font-bold text-ghee md:text-4xl">How bilona ghee is made</h2>
            <p className="mt-3 max-w-lg text-white/70">Curd, churning, makkhan, ghee. The slow way gives our A2 ghee its rich aroma and granular texture.</p>
            <ol className="mt-8 space-y-6">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ghee/60 font-display text-lg font-bold text-ghee">{i + 1}</span>
                  <div><p className="font-semibold text-white">{t}</p><p className="mt-0.5 text-sm leading-relaxed text-white/65">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <h2 className="text-3xl font-bold text-kadhai md:text-4xl">One jar, every corner of the home</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {USES.map(([src, t, d]) => (
            <figure key={t}>
              <img src={src} alt="" loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
              <figcaption className="mt-3"><p className="font-semibold text-kadhai">{t}</p><p className="mt-0.5 text-sm text-muted">{d}</p></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <div className="grid overflow-hidden rounded-3xl bg-label text-white md:grid-cols-2">
          <div className="p-8 md:p-12">
            <h2 className="text-3xl font-bold md:text-4xl">Ghee for derasars and dharmik anushthans</h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/80">Bulk ghee for pooja, aarti, diya and bhojanshala prasad, at special rates for derasars, temples and sanghs. Or offer a ghee laabh on a birthday or anniversary and we deliver it to the derasar of your choice.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/derasar" className="rounded-full bg-ghee px-6 py-3 text-sm font-semibold text-kadhai hover:bg-[#ebb53d]">Bulk rates for derasars</Link>
              <Link href="/ghee-laabh-yojna" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10">Ghee Laabh Yojna</Link>
            </div>
          </div>
          <div className="flex items-end justify-center bg-[#163a25] px-8 pt-10">
            <div className="arch w-full max-w-xs bg-butter p-6 pb-2"><img src="/brand/photos/pack-cow.jpg" alt="" loading="lazy" className="pack w-full" /></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-20 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-3xl font-bold text-kadhai md:text-4xl">Questions we get asked</h2>
          {wa && <p className="mt-3 text-muted">Something else? <a href={wa} target="_blank" rel="noreferrer" className="font-semibold text-maroon hover:underline">Ask us on WhatsApp</a>.</p>}
        </div>
        <div className="divide-y divide-line border-y border-line">
          {content.faq.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-kadhai">
                {f.q}<span aria-hidden className="text-xl text-maroon transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-2xl leading-relaxed text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
