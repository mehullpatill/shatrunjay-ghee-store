import React from "react";
import { prisma } from "@/lib/prisma";
import { ContactFormCard } from "@/components/ContactFormCard";

export const dynamic = "force-dynamic";

export default async function BulkOrderPage() {
  const [intro, settings] = await Promise.all([
    prisma.cmsSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "BULK_ORDER", sectionKey: "intro" } } }),
    prisma.siteSetting.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <ContactFormCard
      source="BULK_ORDER"
      heading={intro?.heading || "Bulk Order Enquiry"}
      subheading={intro?.subheading || "Tell us your bulk requirement and our team will respond promptly."}
      whatsappNumber={settings?.whatsappNumber || "+91 81696 29908"}
      supportEmail={settings?.supportEmail || "info@shatrunjayghee.com"}
      storeAddress={settings?.storeAddress || "Mumbai, Maharashtra, India"}
      storeMapUrl={settings?.storeMapUrl || "https://maps.google.com"}
    />
  );
}
