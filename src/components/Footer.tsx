import React from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  settings: {
    brandNameHindi: string;
    brandNameEnglish: string;
    hindiLogoUrl: string | null;
    englishLogoUrl: string | null;
    whatsappNumber: string;
    supportEmail: string;
    footerTaglineGujarati: string;
    footerDescription: string;
    copyrightText: string;
    instagramUrl: string;
    linkedinUrl: string;
    facebookUrl: string;
    youtubeUrl: string;
    footerLinksJson: unknown;
  } | null;
  licenses: Array<{ id: string; name: string; number: string }>;
}

export function Footer({ settings, licenses }: FooterProps) {
  const groups = (settings?.footerLinksJson || {}) as Record<string, FooterLink[]>;
  const whatsappDigits = (settings?.whatsappNumber || "+91 81696 29908").replace(/[^\d]/g, "");

  const gstin = licenses.find((l) => l.name.toUpperCase().includes("GSTIN"));
  const fssai = licenses.find((l) => l.name.toUpperCase().includes("FSSAI"));

  return (
    <footer className="mt-16 border-t border-espresso/15 bg-espresso text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              {settings?.hindiLogoUrl ? (
                <img src={settings.hindiLogoUrl} alt={settings.brandNameHindi} className="h-10 w-auto rounded bg-white p-1" />
              ) : (
                <span className="rounded-xl border-2 border-ghee bg-cream px-2.5 py-1 font-serif text-base font-bold text-espresso">
                  {settings?.brandNameHindi || "शत्रुंजय"}
                </span>
              )}
              <span className="font-serif text-xl font-bold text-cream">
                {settings?.brandNameEnglish || "Shatrunjay"}
              </span>
            </Link>

            <p className="font-serif text-base font-semibold text-ghee-light">
              {settings?.footerTaglineGujarati || "શુદ્ધ ઘી અને સમયસર ડિલિવરી એજ શત્રુંજય ઘી"}
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-cream/75">
              {settings?.footerDescription}
            </p>

            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-leaf px-4 py-2 text-xs font-semibold text-white transition hover:bg-leaf-light"
            >
              <MessageCircle className="h-4 w-4" />
              {settings?.whatsappNumber || "+91 81696 29908"}
            </a>

            <div className="pt-2 text-xs text-cream/70 space-y-1">
              {gstin && <p><strong>{gstin.name}:</strong> {gstin.number}</p>}
              {fssai && <p><strong>{fssai.name}:</strong> {fssai.number}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ghee-light">Shop</h3>
            <ul className="mt-3 space-y-2 text-xs text-cream/80">
              {(groups.shop || []).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ghee-light">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ghee-light">Derasar</h3>
            <ul className="mt-3 space-y-2 text-xs text-cream/80">
              {(groups.derasar || []).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ghee-light">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ghee-light">Wholesale</h3>
              <ul className="mt-3 space-y-2 text-xs text-cream/80">
                {(groups.wholesale || []).map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-ghee-light">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ghee-light">Legal & Talk to Us</h3>
              <ul className="mt-3 space-y-2 text-xs text-cream/80">
                <li>
                  <Link href="/contact" className="hover:text-ghee-light">Talk to us</Link>
                </li>
                {(groups.legal || []).map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-ghee-light">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-cream/15 pt-6 text-xs text-cream/70 sm:flex-row">
          <p>{settings?.copyrightText || "© 2026 Shatrunjay Ghee by Shatrunjay Foodstuffs Private Limited. All rights reserved."}</p>
          <div className="flex items-center gap-4">
            <a href={settings?.instagramUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-ghee-light">Instagram</a>
            <a href={settings?.linkedinUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-ghee-light">LinkedIn</a>
            <a href={settings?.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-ghee-light">Facebook</a>
            <a href={settings?.youtubeUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-ghee-light">YouTube Shorts</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
