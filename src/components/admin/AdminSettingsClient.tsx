"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettingsMap } from "@/lib/cms";

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
  const [msg, setMsg] = useState("");

  // 2FA setup state
  const [qrUrl, setQrUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");

  const saveSettings = async (e: React.FormEvent) => {
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

        <button type="submit" className="btn">Save Settings</button>
      </form>

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
