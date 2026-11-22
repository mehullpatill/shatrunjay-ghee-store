import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { MailIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { getSiteSettings } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Bulk Order Enquiry" };
export const revalidate = 120;

export default async function BulkOrderPage() {
  const [settings, headerSection] = await Promise.all([
    getSiteSettings(),
    prisma.siteSection.findUnique({ where: { pageKey_sectionKey: { pageKey: "bulk_order", sectionKey: "header" } } }),
  ]);

  const cleanWa = settings.whatsappNumber.replace(/\D/g, "");
  const waHref = `https://wa.me/${cleanWa.length === 10 ? "91" + cleanWa : cleanWa}`;
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(settings.contactInfo.email)}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.contactInfo.address)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-extrabold text-kadhai md:text-5xl">
        {headerSection?.heading || "Bulk Order Enquiry"}
      </h1>
      <p className="mt-2 max-w-xl text-lg text-muted">
        {headerSection?.subheading || "Tell us your required quantity, pack size, and delivery location."}
      </p>

      <div className={`mt-10 grid gap-4 ${settings.whatsappEnabled ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {settings.whatsappEnabled && cleanWa && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="group rounded-3xl border border-line bg-white p-6 transition-shadow hover:shadow-lg">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-[#1fa855]">
              <WhatsAppIcon size={24} />
            </span>
            <p className="mt-4 font-bold text-kadhai group-hover:text-maroon">Whatsapp Us</p>
            <p className="mt-1 text-sm text-muted">Bulk desk on WhatsApp</p>
            <p className="mt-2 text-sm font-semibold text-kadhai">{settings.whatsappNumber}</p>
          </a>
        )}
        <a href={gmailHref} target="_blank" rel="noopener noreferrer" className="group rounded-3xl border border-line bg-white p-6 transition-shadow hover:shadow-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-label">
            <MailIcon size={24} />
          </span>
          <p className="mt-4 font-bold text-kadhai group-hover:text-maroon">Email Us</p>
          <p className="mt-1 text-sm text-muted">Compose an email in Gmail</p>
          <p className="mt-2 break-all text-sm font-semibold text-kadhai">{settings.contactInfo.email}</p>
        </a>
        <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="group rounded-3xl border border-line bg-white p-6 transition-shadow hover:shadow-lg">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-label">
            <PinIcon size={24} />
          </span>
          <p className="mt-4 font-bold text-kadhai group-hover:text-maroon">Visit Our Store</p>
          <p className="mt-1 text-sm text-muted">Open directions in Google Maps</p>
          <p className="mt-2 text-sm font-semibold text-kadhai">{settings.contactInfo.address}</p>
        </a>
      </div>

      <div className="mt-10">
        <ContactForm type="BULK_ENQUIRY" />
      </div>
    </div>
  );
}
