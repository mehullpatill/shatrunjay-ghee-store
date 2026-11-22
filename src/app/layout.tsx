import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = {
  title: { default: "Shatrunjay Pure Ghee", template: "%s | Shatrunjay Pure Ghee" },
  description: "A2 Gir Cow Ghee, Pure Cow and Buffalo Ghee — made the traditional Bilona way.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
