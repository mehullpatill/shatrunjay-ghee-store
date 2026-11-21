import React from "react";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OurStoryPage() {
  const [banner, journeyBanner, intro, licenses] = await Promise.all([
    prisma.banner.findFirst({ where: { pageKey: "OUR_STORY", isActive: true } }),
    prisma.banner.findFirst({ where: { pageKey: "OUR_STORY_JOURNEY", isActive: true } }),
    prisma.cmsSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "OUR_STORY", sectionKey: "intro" } } }),
    prisma.license.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-espresso p-10 text-cream">
        {banner?.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{banner?.title || "Our Story"}</h1>
          {banner?.subtitle && <p className="mt-2 text-sm text-cream/80">{banner.subtitle}</p>}
        </div>
      </div>

      {intro && (
        <section className="rounded-3xl border border-espresso/10 bg-white p-8 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-espresso">{intro.heading}</h2>
          {intro.subheading && <p className="mt-1 text-sm font-semibold text-ghee-dark">{intro.subheading}</p>}
          {intro.content && <p className="mt-3 text-sm leading-relaxed text-taupe">{intro.content}</p>}
        </section>
      )}

      {journeyBanner && (
        <div className="relative overflow-hidden rounded-3xl bg-cream-warm border border-espresso/10 p-10">
          {journeyBanner.imageUrl && (
            <img src={journeyBanner.imageUrl} alt={journeyBanner.title} className="mb-6 max-h-96 w-full rounded-2xl object-cover" />
          )}
          <h2 className="font-serif text-2xl font-bold text-espresso">{journeyBanner.title}</h2>
          {journeyBanner.subtitle && <p className="mt-2 text-sm text-taupe">{journeyBanner.subtitle}</p>}
        </div>
      )}

      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-espresso">Licenses & Registrations</h2>
          <p className="text-sm text-taupe">Verified statutory credentials of Shatrunjay Foodstuffs Private Limited</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {licenses.map((lic) => (
            <div key={lic.id} className="rounded-2xl border border-espresso/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-ghee-dark">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">{lic.name}</span>
              </div>
              <p className="mt-3 font-mono text-sm font-semibold text-espresso break-all">{lic.number}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
