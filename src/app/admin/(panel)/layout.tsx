import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Mukta } from "next/font/google";
import { getAdmin } from "@/lib/adminSession";
import Sidebar from "./Sidebar";
import { Toaster } from "./ui";

// Mukta carries Devanagari too, so headings sit in the same family of letterforms as the logo's wordmark.
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["500", "700", "800"], variable: "--font-mukta" });
export const metadata = { title: "Shop admin", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await getAdmin())) redirect("/admin/login");
  return (
    <div className={`adm ${mukta.variable} min-h-screen md:flex`}>
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-16 pt-5 md:px-8 md:pt-7">
        <div className="mx-auto max-w-[1280px]"><Suspense>{children}</Suspense></div>
      </main>
      <Toaster />
    </div>
  );
}
