import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Wholesale" };
export const revalidate = 120;

export default async function WholesalePage() {
  const [banner, sections, archives] = await Promise.all([
    prisma.banner.findFirst({ where: { placement: "WHOLESALE_STATIC", active: true } }),
    prisma.siteSection.findMany({ where: { pageKey: "wholesale" }, orderBy: { sortOrder: "asc" } }),
    prisma.archiveEntry.findMany({
      where: { sectionKey: { startsWith: "wholesale:" }, active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <section className="bg-kadhai text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold text-ghee md:text-5xl">
              {banner?.title || "Wholesale & Bulk Ghee Supply"}
            </h1>
            <p className="mt-4 max-w-xl text-white/80">{banner?.subtitle}</p>
            <Link
              href={banner?.ctaLink || "/bulk-order"}
              className="mt-6 inline-block rounded-full bg-ghee px-6 py-3 text-sm font-semibold text-kadhai hover:bg-[#ebb53d]"
            >
              {banner?.ctaText || "Enquire for Bulk Order"}
            </Link>
          </div>
          {banner?.imageUrl && (
            <img src={banner.imageUrl} alt={banner.title} className="aspect-video w-full rounded-3xl object-cover shadow-xl" />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-14 md:px-6">
        {sections.map((sec) => {
          const secArchives = archives.filter((a) => a.sectionKey === `wholesale:${sec.sectionKey}`);
          return (
            <section key={sec.id} id={sec.sectionKey} className="scroll-mt-24 rounded-3xl border border-line bg-white p-6 md:p-8">
              <h2 className="text-2xl font-bold text-kadhai md:text-3xl">{sec.heading}</h2>
              {sec.subheading && <p className="mt-1 text-base font-medium text-maroon">{sec.subheading}</p>}
              {sec.content && (
                <div className="prose-shop mt-3 text-sm leading-relaxed text-ink/85" dangerouslySetInnerHTML={{ __html: sec.content }} />
              )}

              {secArchives.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {secArchives.map((entry) => (
                    <div key={entry.id} className="overflow-hidden rounded-2xl border border-line bg-butter/40">
                      <img src={entry.imageUrl} alt={entry.name} className="aspect-square w-full object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-bold text-kadhai">{entry.name}</p>
                        {entry.location && <p className="text-xs text-muted">{entry.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
