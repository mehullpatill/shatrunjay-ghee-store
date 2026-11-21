import React from "react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GheeLaabhYojnaPage() {
  const [banner, intro, archives] = await Promise.all([
    prisma.banner.findFirst({ where: { pageKey: "GHEE_LAABH_YOJNA", isActive: true } }),
    prisma.cmsSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "GHEE_LAABH_YOJNA", sectionKey: "intro" } } }),
    prisma.archiveEntry.findMany({ where: { archiveType: "GHEE_LAABH_YOJNA", isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-espresso p-10 text-cream">
        {banner?.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{banner?.title || "Ghee Laabh Yojna"}</h1>
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

      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-bold text-espresso">Jinalays Served via Ghee Laabh Yojna</h2>
        {archives.length === 0 ? (
          <p className="text-sm text-taupe">Add Ghee Laabh Yojna entries from Admin Panel → Archives.</p>
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
