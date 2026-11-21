import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      settings,
      movingHeader,
      banners,
      categories,
      whyItems,
      makingProcesses,
      reels,
      visiblePromos,
    ] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { id: "default" } }),
      prisma.movingHeaderItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.whyShatrunjayItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.makingProcessSection.findMany({ where: { isActive: true } }),
      prisma.instagramReel.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.discountCode.findMany({
        where: { isActive: true, showOnSite: true },
        select: { code: true, discountType: true, value: true, maxDiscountInr: true, minOrderInr: true },
      }),
    ]);

    return NextResponse.json({
      settings,
      movingHeader,
      banners,
      categories,
      whyItems,
      makingProcesses,
      reels,
      visiblePromos,
    });
  } catch (err) {
    console.error("Storefront bootstrap error:", err);
    return NextResponse.json({ error: "Failed to load storefront data" }, { status: 500 });
  }
}
