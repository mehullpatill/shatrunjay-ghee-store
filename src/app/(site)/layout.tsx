import { Mukta } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { WhatsAppIcon } from "@/components/icons";
import { getContent, waLink } from "@/lib/content";

const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["500", "700", "800"], variable: "--font-mukta" });

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { content } = await getContent();
  return (
    <div className={`site ${mukta.variable}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">Skip to content</a>
      {content.announcement && <div className="bg-kadhai px-4 py-2 text-center text-xs font-medium text-ghee sm:text-sm">{content.announcement}</div>}
      <Header />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <Footer content={content} />
      {content.phone && (
        <a href={waLink(content.phone, "Hi, I'd like to order Shatrunjay ghee")} target="_blank" rel="noreferrer" aria-label="Order on WhatsApp"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-lg transition-transform hover:scale-105">
          <WhatsAppIcon size={28} />
        </a>
      )}
    </div>
  );
}
