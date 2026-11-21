import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WholesalePage() {
  const [banner, sections, archives] = await Promise.all([
    prisma.banner.findFirst({ where: { pageKey: "WHOLESALE", isActive: true } }),
    prisma.cmsSection.findMany({ where: { pageKey: "WHOLESALE", isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.archiveEntry.findMany({ where: { archiveType: "WHOLESALE", isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-espresso p-10 text-cream">
        {banner?.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{banner?.title || "Wholesale"}</h1>
          {banner?.subtitle && <p className="text-sm text-cream/80">{banner.subtitle}</p>}
          <Link
            href={banner?.ctaUrl || "/bulk-order"}
            className="inline-block rounded-full bg-ghee px-6 py-2.5 text-xs font-bold text-white hover:bg-ghee-dark"
          >
            {banner?.ctaLabel || "Enquire About Bulk Orders"}
          </Link>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {sections.map((sec) => (
          <div key={sec.id} id={sec.sectionKey} className="scroll-mt-24 rounded-2xl border border-espresso/10 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-espresso">{sec.heading}</h2>
            {sec.subheading && <p className="mt-1 text-xs font-semibold text-ghee-dark">{sec.subheading}</p>}
            {sec.content && <p className="mt-3 text-sm leading-relaxed text-taupe">{sec.content}</p>}
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-bold text-espresso">Where We Supply</h2>
        {archives.length === 0 ? (
          <p className="text-sm text-taupe">Add wholesale supply partners from Admin Panel → Archives.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {archives.map((a) => (
              <div key={a.id} className="overflow-hidden rounded-2xl border border-espresso/10 bg-white shadow-sm">
                <div className="aspect-[4/3] bg-cream-soft">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-taupe">No Photo</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-espresso">{a.title}</h3>
                  {a.location && <p className="mt-0.5 text-xs text-taupe">{a.location}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
