"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FooterLink, SiteSettingsMap } from "@/lib/cms";

function linksToText(links: FooterLink[]): string {
  return links.map((link) => `${link.label} | ${link.href}`).join("\n");
}

function textToLinks(text: string): FooterLink[] {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf("|");
    return separator === -1
      ? { label: line, href: "#" }
      : { label: line.slice(0, separator).trim(), href: line.slice(separator + 1).trim() };
  }).filter((link) => link.label && link.href);
}

export default function AdminSettingsClient({
  settings,
  totpEnabled,
}: {
  settings: SiteSettingsMap;
  totpEnabled: boolean;
}) {
  const router = useRouter();
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings.whatsappEnabled);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [businessEmail, setBusinessEmail] = useState(settings.businessEmail);
  const [googlePlaceId, setGooglePlaceId] = useState(settings.googlePlaceId);
  const [tickerEnabled, setTickerEnabled] = useState(settings.tickerEnabled);
  const [tickerText, setTickerText] = useState(settings.tickerMessages.join("\n"));
  const [contactPhone, setContactPhone] = useState(settings.contactInfo.phone);
  const [contactEmail, setContactEmail] = useState(settings.contactInfo.email);
  const [contactAddress, setContactAddress] = useState(settings.contactInfo.address);
  const [instagram, setInstagram] = useState(settings.socialLinks.instagram);
  const [linkedin, setLinkedin] = useState(settings.socialLinks.linkedin);
  const [facebook, setFacebook] = useState(settings.socialLinks.facebook);
  const [youtube, setYoutube] = useState(settings.socialLinks.youtube);
  const [footerBrandName, setFooterBrandName] = useState(settings.footerBrandName);
  const [footerLogoUrl, setFooterLogoUrl] = useState(settings.footerLogoUrl);
  const [footerTagline, setFooterTagline] = useState(settings.footerTagline);
  const [footerDescription, setFooterDescription] = useState(settings.footerDescription);
  const [footerShopHeading, setFooterShopHeading] = useState(settings.footerShopHeading);
  const [footerDerasarHeading, setFooterDerasarHeading] = useState(settings.footerDerasarHeading);
  const [footerWholesaleHeading, setFooterWholesaleHeading] = useState(settings.footerWholesaleHeading);
  const [footerContactHeading, setFooterContactHeading] = useState(settings.footerContactHeading);
  const [footerShopLinks, setFooterShopLinks] = useState(linksToText(settings.footerShopLinks));
  const [footerDerasarLinks, setFooterDerasarLinks] = useState(linksToText(settings.footerDerasarLinks));
  const [footerWholesaleLinks, setFooterWholesaleLinks] = useState(linksToText(settings.footerWholesaleLinks));
  const [footerLegalLinks, setFooterLegalLinks] = useState(linksToText(settings.footerLegalLinks));
  const [footerCopyrightText, setFooterCopyrightText] = useState(settings.footerCopyrightText);
  const [footerComplianceText, setFooterComplianceText] = useState(settings.footerComplianceText);
  const [botWelcomeImageUrl, setBotWelcomeImageUrl] = useState(settings.botWelcomeImageUrl);
  const [botCowReelUrl, setBotCowReelUrl] = useState(settings.botReels.cow);
  const [botBuffaloReelUrl, setBotBuffaloReelUrl] = useState(settings.botReels.buffalo);
  const [botA2ReelUrl, setBotA2ReelUrl] = useState(settings.botReels.a2);
  const [msg, setMsg] = useState("");

  // 2FA setup state
  const [qrUrl, setQrUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");

  const saveSettings = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          whatsappEnabled,
          whatsappNumber,
          businessEmail,
          googlePlaceId,
          tickerEnabled,
          tickerMessages: tickerText.split("\n").map((s) => s.trim()).filter(Boolean),
          contactInfo: { phone: contactPhone, email: contactEmail, address: contactAddress },
          socialLinks: { instagram, linkedin, facebook, youtube },
          footerBrandName,
          footerLogoUrl,
          footerTagline,
          footerDescription,
          footerShopHeading,
          footerDerasarHeading,
          footerWholesaleHeading,
          footerContactHeading,
          footerShopLinks: textToLinks(footerShopLinks),
          footerDerasarLinks: textToLinks(footerDerasarLinks),
          footerWholesaleLinks: textToLinks(footerWholesaleLinks),
          footerLegalLinks: textToLinks(footerLegalLinks),
          footerCopyrightText,
          footerComplianceText,
          botWelcomeImageUrl,
          botReels: { cow: botCowReelUrl, buffalo: botBuffaloReelUrl, a2: botA2ReelUrl },
        },
      }),
    });
    setMsg(res.ok ? "Settings saved." : "Failed to save settings.");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-kadhai">Site Settings &amp; 2FA</h1>
      {msg && <p className="rounded-lg bg-butter px-4 py-2 text-sm font-medium text-kadhai">{msg}</p>}

      <form onSubmit={saveSettings} className="panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-kadhai">General &amp; WhatsApp Toggle</h2>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} />
          Enable WhatsApp icons &amp; cards on storefront (default OFF)
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="lbl">WhatsApp Number</span>
            <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="lbl">Business Inbox Email</span>
            <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="field" />
          </label>
        </div>
        <label className="block">
          <span className="lbl">Google Places ID (for Customer Reviews)</span>
          <input type="text" value={googlePlaceId} onChange={(e) => setGooglePlaceId(e.target.value)} className="field" />
        </label>

        <div className="pt-2 border-t border-line space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={tickerEnabled} onChange={(e) => setTickerEnabled(e.target.checked)} />
            Show Moving Marquee Ticker at Top
          </label>
          <textarea rows={3} value={tickerText} onChange={(e) => setTickerText(e.target.value)} className="field text-xs" placeholder="One ticker message per line (emojis supported)" />
        </div>

        <div className="pt-4 border-t border-line space-y-4">
          <div>
            <h2 className="text-lg font-bold text-kadhai">Footer Content</h2>
            <p className="mt-1 text-xs text-muted">Manage the footer text, contact details, social links, legal links, and column navigation. For link lists, use one entry per line in the format: Label | /path</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="lbl">Brand Name</span><input value={footerBrandName} onChange={(e) => setFooterBrandName(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">Logo URL</span><input value={footerLogoUrl} onChange={(e) => setFooterLogoUrl(e.target.value)} className="field" /></label>
            <label className="block sm:col-span-2"><span className="lbl">Footer Tagline</span><input value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} className="field" /></label>
            <label className="block sm:col-span-2"><span className="lbl">Footer Description</span><textarea rows={3} value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} className="field" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block"><span className="lbl">Shop Heading</span><input value={footerShopHeading} onChange={(e) => setFooterShopHeading(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">Derasar Heading</span><input value={footerDerasarHeading} onChange={(e) => setFooterDerasarHeading(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">Wholesale Heading</span><input value={footerWholesaleHeading} onChange={(e) => setFooterWholesaleHeading(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">Contact Heading</span><input value={footerContactHeading} onChange={(e) => setFooterContactHeading(e.target.value)} className="field" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="lbl">Phone</span><input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">Contact Email</span><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="field" /></label>
            <label className="block sm:col-span-2"><span className="lbl">Address</span><textarea rows={3} value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} className="field" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="lbl">Instagram URL</span><input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">LinkedIn URL</span><input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">Facebook URL</span><input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">YouTube URL</span><input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} className="field" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="lbl">Shop Links</span><textarea rows={6} value={footerShopLinks} onChange={(e) => setFooterShopLinks(e.target.value)} className="field font-mono text-xs" /></label>
            <label className="block"><span className="lbl">Derasar Links</span><textarea rows={6} value={footerDerasarLinks} onChange={(e) => setFooterDerasarLinks(e.target.value)} className="field font-mono text-xs" /></label>
            <label className="block"><span className="lbl">Wholesale Links</span><textarea rows={6} value={footerWholesaleLinks} onChange={(e) => setFooterWholesaleLinks(e.target.value)} className="field font-mono text-xs" /></label>
            <label className="block"><span className="lbl">Legal Links</span><textarea rows={6} value={footerLegalLinks} onChange={(e) => setFooterLegalLinks(e.target.value)} className="field font-mono text-xs" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="lbl">Copyright Text</span><input value={footerCopyrightText} onChange={(e) => setFooterCopyrightText(e.target.value)} className="field" /></label>
            <label className="block"><span className="lbl">Compliance Text</span><input value={footerComplianceText} onChange={(e) => setFooterComplianceText(e.target.value)} placeholder="Leave blank to show GSTIN/FSSAI licenses" className="field" /></label>
          </div>
        </div>

        <button type="submit" className="btn">Save Settings</button>
      </form>

      <section className="panel p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-kadhai">WhatsApp Bot Media</h2>
          <p className="mt-1 text-xs text-muted">
            These URLs are stored in the shared settings and can be used by the WhatsApp bot configuration. Do not place secrets here.
          </p>
        </div>
        <label className="block">
          <span className="lbl">Welcome Image URL</span>
          <input type="url" value={botWelcomeImageUrl} onChange={(e) => setBotWelcomeImageUrl(e.target.value)} className="field" placeholder="https://..." />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block"><span className="lbl">Cow Ghee Reel URL</span><input type="url" value={botCowReelUrl} onChange={(e) => setBotCowReelUrl(e.target.value)} className="field" placeholder="https://..." /></label>
          <label className="block"><span className="lbl">Buffalo Ghee Reel URL</span><input type="url" value={botBuffaloReelUrl} onChange={(e) => setBotBuffaloReelUrl(e.target.value)} className="field" placeholder="https://..." /></label>
          <label className="block"><span className="lbl">A2 Ghee Reel URL</span><input type="url" value={botA2ReelUrl} onChange={(e) => setBotA2ReelUrl(e.target.value)} className="field" placeholder="https://..." /></label>
        </div>
        <button type="button" onClick={saveSettings} className="btn">Save Bot Media</button>
      </section>

      <div className="panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-kadhai">Admin 2FA (TOTP Authenticator)</h2>
        <p className="text-sm text-muted">Status: <strong>{totpEnabled ? "Enabled" : "Disabled"}</strong></p>
        {!totpEnabled ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/admin/2fa");
                const d = (await res.json()) as { qrDataUrl?: string };
                if (d.qrDataUrl) setQrUrl(d.qrDataUrl);
              }}
              className="btn-ghost text-xs"
            >
              Generate 2FA QR Code
            </button>
            {qrUrl && (
              <div className="space-y-3">
                <img src={qrUrl} alt="2FA QR Code" className="h-44 w-44 rounded-lg border border-line" />
                <div className="flex gap-2">
                  <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="Enter 6-digit code" className="field w-44" />
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch("/api/admin/2fa", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: totpCode }),
                      });
                      setMsg(res.ok ? "2FA Enabled!" : "Invalid code");
                      router.refresh();
                    }}
                    className="btn text-xs"
                  >
                    Verify &amp; Enable
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enable: false }),
              });
              router.refresh();
            }}
            className="btn-ghost text-xs text-maroon"
          >
            Disable 2FA
          </button>
        )}
      </div>
    </div>
  );
}
