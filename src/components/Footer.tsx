import Link from "next/link";
import type { FooterLink, SiteSettingsMap } from "@/lib/cms";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "./icons";

export default function Footer({
  settings,
  licenses,
}: {
  settings: SiteSettingsMap;
  licenses: Array<{ name: string; number: string }>;
}) {
  const cleanWa = settings.whatsappNumber.replace(/\D/g, "");
  const waHref = `https://wa.me/${cleanWa.length === 10 ? "91" + cleanWa : cleanWa}`;
  const gstin = licenses.find((l) => l.name.toUpperCase().includes("GSTIN"));
  const fssai = licenses.find((l) => l.name.toUpperCase().includes("FSSAI"));
  const renderLinks = (links: FooterLink[]) => links.map((link) => (
    <Link key={`${link.label}-${link.href}`} href={link.href} className="block hover:text-ghee">{link.label}</Link>
  ));

  return (
    <footer className="mt-24 bg-kadhai text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-sm md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr] md:px-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl bg-[#fffaf0] px-3 py-2">
            <img src={settings.footerLogoUrl || "/brand/logo.png"} alt={settings.footerBrandName} className="h-12" />
            <span className="font-display text-lg font-extrabold text-kadhai">{settings.footerBrandName}</span>
          </Link>
          <p className="mt-4 font-display text-base font-bold text-ghee">
            {settings.footerTagline}
          </p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/70">
            {settings.footerDescription}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
            {settings.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ghee">
                Instagram
              </a>
            )}
            {settings.socialLinks.linkedin && (
              <a href={settings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ghee">
                LinkedIn
              </a>
            )}
            {settings.socialLinks.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-ghee">
                Facebook
              </a>
            )}
            {settings.socialLinks.youtube && (
              <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-ghee">
                YouTube Shorts
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-white">{settings.footerShopHeading}</p>
          {renderLinks(settings.footerShopLinks)}
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-white">{settings.footerDerasarHeading}</p>
          {renderLinks(settings.footerDerasarLinks)}
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-white">{settings.footerWholesaleHeading}</p>
          {renderLinks(settings.footerWholesaleLinks)}
          <div className="pt-2 space-y-1.5 border-t border-white/10">
            {settings.footerLegalLinks.map((link) => <Link key={`${link.label}-${link.href}`} href={link.href} className="block text-xs hover:text-ghee">{link.label}</Link>)}
          </div>
        </div>

        <address className="space-y-2.5 not-italic">
          <p className="font-semibold text-white">{settings.footerContactHeading}</p>
          {settings.contactInfo.phone && (
            <a href={`tel:${settings.contactInfo.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:text-ghee">
              <PhoneIcon size={16} />
              <span>{settings.contactInfo.phone}</span>
            </a>
          )}
          {settings.whatsappEnabled && cleanWa && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ghee">
              <WhatsAppIcon size={16} />
              <span>WhatsApp Us</span>
            </a>
          )}
          {settings.contactInfo.email && (
            <a href={`mailto:${settings.contactInfo.email}`} className="flex items-center gap-2 break-all hover:text-ghee">
              <MailIcon size={16} />
              <span>{settings.contactInfo.email}</span>
            </a>
          )}
          {settings.contactInfo.address && (
            <p className="flex gap-2 text-xs leading-relaxed">
              <span className="mt-0.5 shrink-0"><PinIcon size={16} /></span>
              <span>{settings.contactInfo.address}</span>
            </p>
          )}
        </address>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-white/60 md:px-6">
          <p>{settings.footerCopyrightText}</p>
          <p>{settings.footerComplianceText || [gstin && `GSTIN: ${gstin.number}`, fssai && `FSSAI: ${fssai.number}`].filter(Boolean).join("  |  ")}</p>
        </div>
      </div>
    </footer>
  );
}
