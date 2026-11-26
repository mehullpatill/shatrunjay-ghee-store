import { prisma } from "@/lib/prisma";
import AdminProductsClient from "@/components/admin/AdminProductsClient";
import { getEnv } from "@/lib/env";
import LeadrProducts from "@/components/leadr-admin/(panel)/products/page";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (getEnv().COMMERCE_BACKEND === "leadr") return <LeadrProducts />;
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <AdminProductsClient categories={categories} products={products} />;
}
