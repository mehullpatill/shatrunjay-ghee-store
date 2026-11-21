import React from "react";
import { prisma } from "@/lib/prisma";
import { FileText, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LabReportsPage() {
  const [banner, intro, reports] = await Promise.all([
    prisma.banner.findFirst({ where: { pageKey: "LAB_REPORTS", isActive: true } }),
    prisma.cmsSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "LAB_REPORTS", sectionKey: "intro" } } }),
    prisma.labReport.findMany({ where: { isActive: true }, orderBy: { reportDate: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-espresso p-10 text-cream">
        {banner?.imageUrl && <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{banner?.title || "Lab Reports"}</h1>
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

      <section>
        {reports.length === 0 ? (
          <p className="text-sm text-taupe">Upload PDF or image lab reports from Admin Panel → Lab Reports.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-col justify-between rounded-2xl border border-espresso/10 bg-white p-5 shadow-sm">
                <div>
                  <div className="aspect-[4/3] overflow-hidden rounded-xl border border-espresso/10 bg-cream-soft flex items-center justify-center">
                    {r.thumbnailUrl ? (
                      <img src={r.thumbnailUrl} alt={`Batch ${r.batchNo}`} className="h-full w-full object-cover" />
                    ) : r.fileType === "IMAGE" ? (
                      <img src={r.fileUrl} alt={`Batch ${r.batchNo}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-ghee-dark">
                        <FileText className="h-12 w-12" />
                        <span className="text-xs font-semibold uppercase">PDF Lab Report</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-ghee-dark">Batch No: {r.batchNo}</p>
                    <h3 className="font-semibold text-espresso">{r.labName}</h3>
                    <p className="text-xs text-taupe">
                      Report Date: {new Date(r.reportDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-espresso px-4 py-2.5 text-xs font-semibold text-cream hover:bg-espresso-light"
                >
                  View Full Report
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
