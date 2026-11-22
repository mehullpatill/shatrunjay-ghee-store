import type { Metadata } from "next";
import { Inter, Mukta } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["500", "700", "800"],
  variable: "--font-mukta",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shatrunjayghee.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shatrunjay Ghee | Pure Cow, Buffalo & A2 Desi Cow Bilona Ghee",
    template: "%s | Shatrunjay Ghee",
  },
  description:
    "Shatrunjay Ghee by Shatrunjay Foodstuffs Private Limited — pure Cow Ghee, Buffalo Ghee, and Bilona A2 Desi Cow Ghee delivered fresh across Mumbai and India.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Shatrunjay Ghee",
    title: "Shatrunjay Ghee — Pure Ghee & Timely Delivery",
    description:
      "Traditional Bilona A2 Desi Cow Ghee, Pure Cow Ghee, and Pure Buffalo Ghee. Free home delivery.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mukta.variable}`}>
      <body className="font-sans antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
