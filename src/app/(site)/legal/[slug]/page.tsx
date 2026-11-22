import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const ALLOWED_SLUGS = ["privacy-policy", "shipping-policy", "refund-policy", "terms-of-service"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sec = await prisma.siteSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "legal", sectionKey: slug } } });
  return { title: sec?.heading || "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!ALLOWED_SLUGS.includes(slug)) notFound();

  const sec = await prisma.siteSection.findUnique({
    where: { pageKey_sectionKey: { pageKey: "legal", sectionKey: slug } },
  });
  if (!sec) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-extrabold text-kadhai">{sec.heading}</h1>
      {sec.subheading && <p className="mt-2 text-sm text-muted">{sec.subheading}</p>}
      <div
        className="prose-shop mt-8 rounded-3xl border border-line bg-white p-6 leading-relaxed text-ink/85 md:p-8"
        dangerouslySetInnerHTML={{ __html: sec.content || "" }}
      />
    </div>
  );
}
