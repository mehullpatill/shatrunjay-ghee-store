import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { WhatsAppIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/cms";
import { prisma } from "@/lib/prisma";
import MobileBottomNav from "@/components/MobileBottomNav";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, licenses] = await Promise.all([
    getCurrentUser(),
    getSiteSettings(),
    prisma.license.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
  ]);

  const cleanWa = settings.whatsappNumber.replace(/\D/g, "");
  const waHref = `https://wa.me/${cleanWa.length === 10 ? "91" + cleanWa : cleanWa}`;

  return (
    <div className="site">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2"
      >
        Skip to content
      </a>

      {settings.tickerEnabled && settings.tickerMessages.length > 0 && (
        <div className="overflow-hidden bg-kadhai py-2 text-xs font-medium text-ghee sm:text-sm">
          <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-12 whitespace-nowrap px-4">
            {[...settings.tickerMessages, ...settings.tickerMessages].map((msg, idx) => (
              <span key={idx}>{msg}</span>
            ))}
          </div>
        </div>
      )}

      <Header
        user={user ? { name: user.name, role: user.role } : null}
        whatsappEnabled={settings.whatsappEnabled}
        whatsappNumber={settings.whatsappNumber}
      />

      <main id="main" className="min-h-[65vh] pb-20 md:pb-0">
        {children}
      </main>

      <Footer settings={settings} licenses={licenses} />

      {settings.whatsappEnabled && cleanWa && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-lg transition-transform hover:scale-105 md:bottom-5"
        >
          <WhatsAppIcon size={28} />
        </a>
      )}

      <MobileBottomNav />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
