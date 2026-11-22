import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://shatrunjayghee.com").replace(/\/$/, "");
  const staticRoutes = [
    "",
    "/shop",
    "/ghee",
    "/groundnut-oil",
    "/derasar",
    "/ghee-laabh-yojna",
    "/lab-reports",
    "/our-story",
    "/contact",
    "/wholesale",
    "/bulk-order",
    "/legal/privacy-policy",
    "/legal/shipping-policy",
    "/legal/refund-policy",
    "/legal/terms-of-service",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });
    const productRoutes = products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
