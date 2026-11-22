import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Ghee Laabh Yojna" };
export const revalidate = 120;

export default async function GheeLaabhYojnaPage() {
  const [banner, intro, archives] = await Promise.all([
    prisma.banner.findFirst({ where: { placement: "GHEE_LAABH_STATIC", active: true } }),
    prisma.siteSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "ghee_laabh_yojna", sectionKey: "intro" } } }),
    prisma.archiveEntry.findMany({
      where: { sectionKey: "ghee_laabh_yojna", active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <section className="bg-label text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">{banner?.title || "Ghee Laabh Yojna"}</h1>
            <p className="mt-4 max-w-xl text-white/85">{banner?.subtitle}</p>
            <Link href="/contact" className="mt-6 inline-block rounded-full bg-ghee px-6 py-3 text-sm font-semibold text-kadhai">
              Book a Ghee Laabh Seva
            </Link>
          </div>
          {banner?.imageUrl && (
            <div className="arch mx-auto w-full max-w-xs bg-butter p-6">
              <img src={banner.imageUrl} alt={banner.title} className="pack w-full" />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {intro && (
          <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
            <h2 className="text-3xl font-bold text-kadhai">{intro.heading}</h2>
            {intro.subheading && <p className="mt-2 text-lg text-maroon">{intro.subheading}</p>}
            {intro.content && (
              <div className="prose-shop mt-4 text-ink/85" dangerouslySetInnerHTML={{ __html: intro.content }} />
            )}
          </div>
        )}

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-kadhai">Jinalays Served Under Ghee Laabh Yojna</h3>
          {archives.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Jinalay archive entries added by our team will appear here.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {archives.map((a) => (
                <article key={a.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <img src={a.imageUrl} alt={a.name} className="aspect-square w-full object-cover" />
                  <div className="p-3.5">
                    <p className="font-bold text-kadhai">{a.name}</p>
                    {a.location && <p className="text-xs text-muted">{a.location}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
