import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LegalPage({ params }: { params: { slug: string } }) {
  const page = await prisma.legalPage.findUnique({ where: { slug: params.slug } });
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-espresso/10 bg-white p-8 shadow-sm md:p-12">
        <h1 className="font-serif text-3xl font-bold text-espresso">{page.title}</h1>
        <p className="mt-2 text-xs text-taupe">
          Last updated: {new Date(page.updatedAt).toLocaleDateString("en-IN")}
        </p>
        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-espresso/85">
          {page.content}
        </div>
      </div>
    </div>
  );
}
