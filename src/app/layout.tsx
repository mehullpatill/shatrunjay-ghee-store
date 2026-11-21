import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { CartProvider } from "@/components/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Shatrunjay Ghee | Pure A2 Desi Cow Ghee, Cow Ghee, Buffalo Ghee & Groundnut Oil",
  description:
    "Lab-tested pure ghee and cold-pressed groundnut oil by Shatrunjay Foodstuffs Private Limited.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let settings = null;
  let movingItems: Array<{ id: string; textWithEmoji: string; linkUrl: string | null }> = [];
  let licenses: Array<{ id: string; name: string; number: string }> = [];

  try {
    [settings, movingItems, licenses] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { id: "default" } }),
      prisma.movingHeaderItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.license.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
  } catch {
    // Allows build-time rendering before DB migration
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased bg-cream text-espresso">
        <CartProvider>
          <Header settings={settings} movingItems={movingItems} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} licenses={licenses} />
        </CartProvider>
      </body>
    </html>
  );
}
