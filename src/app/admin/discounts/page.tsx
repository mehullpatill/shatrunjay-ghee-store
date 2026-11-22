import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/cms";
import AdminDiscountsClient from "@/components/admin/AdminDiscountsClient";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const [promos, coupons, settings] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.couponCode.findMany({ orderBy: { createdAt: "desc" } }),
    getSiteSettings(),
  ]);
  return <AdminDiscountsClient promos={promos} coupons={coupons} referralEnabled={settings.referralEnabled} />;
}
