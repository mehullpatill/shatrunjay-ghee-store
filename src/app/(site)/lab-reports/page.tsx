import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Lab Reports" };
export const revalidate = 120;

export default async function LabReportsPage() {
  const [banner, intro, reports] = await Promise.all([
    prisma.banner.findFirst({ where: { placement: "LAB_REPORTS_STATIC", active: true } }),
    prisma.siteSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "lab_reports", sectionKey: "intro" } } }),
    prisma.labReport.findMany({ orderBy: { reportDate: "desc" } }),
  ]);

  return (
    <div>
      <section className="bg-butter">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold text-kadhai md:text-5xl">
              {banner?.title || "Lab Reports"}
            </h1>
            <p className="mt-3 max-w-xl text-muted">{banner?.subtitle}</p>
          </div>
          {banner?.imageUrl && (
            <img src={banner.imageUrl} alt={banner.title} className="aspect-video w-full rounded-3xl object-cover shadow-md" />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        {intro && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-kadhai">{intro.heading}</h2>
            {intro.subheading && <p className="mt-1 text-muted">{intro.subheading}</p>}
            {intro.content && <div className="prose-shop mt-3 text-sm text-ink/80" dangerouslySetInnerHTML={{ __html: intro.content }} />}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="rounded-3xl border border-line bg-white p-10 text-center">
            <p className="font-semibold text-kadhai">No lab reports uploaded yet.</p>
            <p className="mt-1 text-sm text-muted">Batch test PDFs and certificates uploaded in Admin will appear here sorted newest first.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {reports.map((r) => (
              <a
                key={r.id}
                href={r.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-3xl border border-line bg-white transition-shadow hover:shadow-lg"
              >
                <div className="aspect-[4/3] bg-butter flex items-center justify-center overflow-hidden">
                  {r.thumbnailUrl ? (
                    <img src={r.thumbnailUrl} alt={`Batch ${r.batchNo}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <span className="inline-block rounded-xl bg-maroon px-3 py-1 text-xs font-bold text-white">PDF REPORT</span>
                      <p className="mt-2 text-xs text-muted">Click to open full report</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-kadhai group-hover:text-maroon">Batch No: {r.batchNo}</p>
                  <p className="mt-1 text-xs text-muted">Lab: {r.labName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Date: {new Date(r.reportDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
