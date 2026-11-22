import { prisma } from "@/lib/prisma";
import AdminCmsClient from "@/components/admin/AdminCmsClient";

export const dynamic = "force-dynamic";

export default async function AdminCmsPage() {
  const [sections, processBlocks, licenses, archives, reels] = await Promise.all([
    prisma.siteSection.findMany({ orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }] }),
    prisma.processBlock.findMany({ include: { steps: { orderBy: { stepOrder: "asc" } } } }),
    prisma.license.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.archiveEntry.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.instagramReel.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <AdminCmsClient
      sections={sections}
      processBlocks={processBlocks}
      licenses={licenses}
      archives={archives}
      reels={reels}
    />
  );
}
