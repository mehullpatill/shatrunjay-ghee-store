import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Our Story" };
export const revalidate = 120;

export default async function OurStoryPage() {
  const [banner, journeyBanner, intro, licenses] = await Promise.all([
    prisma.banner.findFirst({ where: { placement: "OUR_STORY_STATIC", active: true } }),
    prisma.banner.findFirst({ where: { placement: "OUR_STORY_JOURNEY", active: true } }),
    prisma.siteSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "our_story", sectionKey: "intro" } } }),
    prisma.license.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <section className="bg-butter">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold text-kadhai md:text-5xl">{banner?.title || "Our Story"}</h1>
            <p className="mt-3 max-w-xl text-muted">{banner?.subtitle}</p>
          </div>
          {banner?.imageUrl && (
            <img src={banner.imageUrl} alt={banner.title} className="arch aspect-[4/3] w-full object-cover shadow-lg" />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-14 md:px-6">
        {intro && (
          <section className="rounded-3xl border border-line bg-white p-6 md:p-10">
            <h2 className="text-3xl font-bold text-kadhai">{intro.heading}</h2>
            {intro.subheading && <p className="mt-2 font-display text-lg font-semibold text-maroon">{intro.subheading}</p>}
            {intro.content && (
              <div className="prose-shop mt-4 leading-relaxed text-ink/85" dangerouslySetInnerHTML={{ __html: intro.content }} />
            )}
          </section>
        )}

        {journeyBanner && (
          <section className="overflow-hidden rounded-3xl bg-kadhai text-white md:grid md:grid-cols-2">
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-ghee">{journeyBanner.title}</h2>
              {journeyBanner.subtitle && <p className="mt-3 text-white/80">{journeyBanner.subtitle}</p>}
            </div>
            <img src={journeyBanner.imageUrl} alt={journeyBanner.title} className="h-full w-full object-cover" />
          </section>
        )}

        {/* Licenses Section: Name + Number below */}
        <section>
          <h2 className="text-3xl font-bold text-kadhai">Licenses &amp; Registrations</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {licenses.map((lic) => (
              <div key={lic.id} className="rounded-2xl border border-line bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{lic.name}</p>
                <p className="mt-2 break-all font-mono text-sm font-bold text-kadhai">{lic.number}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
