import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/cms";
import AdminDiscountsClient from "@/components/admin/AdminDiscountsClient";
import { getEnv } from "@/lib/env";
import LeadrPromos from "@/components/leadr-admin/(panel)/promos/page";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  if (getEnv().COMMERCE_BACKEND === "leadr") return <LeadrPromos />;
  const [promos, coupons, settings] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.couponCode.findMany({ orderBy: { createdAt: "desc" } }),
    getSiteSettings(),
  ]);
  return <AdminDiscountsClient promos={promos} coupons={coupons} referralEnabled={settings.referralEnabled} />;
}
