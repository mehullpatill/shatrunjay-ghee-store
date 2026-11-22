import Link from "next/link";
import type { SiteSettingsMap } from "@/lib/cms";
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

  return (
    <footer className="mt-24 bg-kadhai text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-sm md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr] md:px-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl bg-[#fffaf0] px-3 py-2">
            <img src="/brand/logo.png" alt="Shatrunjay" className="h-12" />
            <span className="font-display text-lg font-extrabold text-kadhai">Shatrunjay</span>
          </Link>
          <p className="mt-4 font-display text-base font-bold text-ghee">
            શુદ્ધ ઘી અને સમયસર ડિલિવરી એજ શત્રુંજય ઘી
          </p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/70">
            Pure Cow Ghee, Buffalo Ghee, and Bilona A2 Desi Cow Ghee crafted in small batches by Shatrunjay Foodstuffs Private Limited.
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
          <p className="font-semibold text-white">Shop</p>
          <Link href="/shop" className="block hover:text-ghee">All Products</Link>
          <Link href="/ghee#cow-ghee" className="block hover:text-ghee">Cow Ghee</Link>
          <Link href="/ghee#buffalo-ghee" className="block hover:text-ghee">Buffalo Ghee</Link>
          <Link href="/ghee#a2-desi-cow-ghee" className="block hover:text-ghee">A2 Desi Cow Ghee</Link>
          <Link href="/groundnut-oil" className="block hover:text-ghee">Groundnut Oil</Link>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-white">Derasar</p>
          <Link href="/derasar#jinalay" className="block hover:text-ghee">Jinalay</Link>
          <Link href="/derasar#bhojanshala" className="block hover:text-ghee">Bhojanshala</Link>
          <Link href="/derasar#pratishtha_mahostav" className="block hover:text-ghee">Pratishtha Mahostav</Link>
          <Link href="/derasar#chaturmas" className="block hover:text-ghee">Chaturmas</Link>
          <Link href="/derasar#varshitap" className="block hover:text-ghee">Varshitap</Link>
          <Link href="/derasar#navanu_yatra" className="block hover:text-ghee">Navanu Yatra</Link>
          <Link href="/ghee-laabh-yojna" className="block hover:text-ghee">Ghee Laabh Yojna</Link>
          <Link href="/derasar#other_religious_functions" className="block hover:text-ghee">Other Religious Functions</Link>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-white">Wholesale & Legal</p>
          <Link href="/wholesale#temples" className="block hover:text-ghee">Temples</Link>
          <Link href="/wholesale#social_events" className="block hover:text-ghee">Social Events</Link>
          <Link href="/wholesale#restaurants_clubs" className="block hover:text-ghee">Restaurants & Clubs</Link>
          <Link href="/wholesale#reseller" className="block hover:text-ghee">Reseller</Link>
          <div className="pt-2 space-y-1.5 border-t border-white/10">
            <Link href="/legal/privacy-policy" className="block text-xs hover:text-ghee">Privacy Policy</Link>
            <Link href="/legal/shipping-policy" className="block text-xs hover:text-ghee">Shipping Policy</Link>
            <Link href="/legal/refund-policy" className="block text-xs hover:text-ghee">Refund Policy</Link>
            <Link href="/legal/terms-of-service" className="block text-xs hover:text-ghee">Terms of Service</Link>
          </div>
        </div>

        <address className="space-y-2.5 not-italic">
          <p className="font-semibold text-white">Talk to us</p>
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
          <p>© 2026 Shatrunjay Ghee by Shatrunjay Foodstuffs Private Limited. All rights reserved.</p>
          <p>
            {[gstin && `GSTIN: ${gstin.number}`, fssai && `FSSAI: ${fssai.number}`]
              .filter(Boolean)
              .join("  |  ")}
          </p>
        </div>
      </div>
    </footer>
  );
}
