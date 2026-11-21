import React from "react";
import { prisma } from "@/lib/prisma";
import { ContactFormCard } from "@/components/ContactFormCard";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [intro, settings] = await Promise.all([
    prisma.cmsSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "CONTACT", sectionKey: "intro" } } }),
    prisma.siteSetting.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <ContactFormCard
      source="CONTACT"
      heading={intro?.heading || "Get in touch"}
      subheading={intro?.subheading || "We'd love to hear from you."}
      whatsappNumber={settings?.whatsappNumber || "+91 81696 29908"}
      supportEmail={settings?.supportEmail || "info@shatrunjayghee.com"}
      storeAddress={settings?.storeAddress || "Mumbai, Maharashtra, India"}
      storeMapUrl={settings?.storeMapUrl || "https://maps.google.com"}
    />
  );
}
