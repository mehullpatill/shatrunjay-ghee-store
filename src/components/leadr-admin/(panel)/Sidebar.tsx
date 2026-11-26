"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApi } from "@/lib/adminApi";
import type { Order } from "./types";

const I = (d: string) => <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const NAV = [
  { href: "/admin", label: "Overview", icon: I("M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10") },
  { href: "/admin/orders", label: "Orders", icon: I("M6 2h12l2 5H4l2-5zM4 7h16v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7zM9 11h6") },
  { href: "/admin/products", label: "Products", icon: I("M9 3h6v3l2 3v11a2 2 0 01-2 2H9a2 2 0 01-2-2V9l2-3V3zM7 13h10") },
  { href: "/admin/customers", label: "Customers", icon: I("M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 19v-1a4 4 0 00-3-3.9M16 3.1a3.5 3.5 0 010 6.8") },
  { href: "/admin/promos", label: "Promos & referrals", icon: I("M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01") },
  { href: "/admin/settings", label: "Settings", icon: I("M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z") },
  { href: "/admin/content", label: "Website content", icon: I("M4 5h16M4 5v14h16V5M4 9h16M8 13h8M8 16h5") },
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // Loading orders here also warms the cache, so the Orders page paints instantly.
  const { data: orders } = useApi<Order[]>("orders");
  const waiting = orders?.filter((o) => o.status === "pending" || o.needs_human_help).length ?? 0;
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-kadhai px-4 py-2.5 md:hidden">
        <img src="/brand/logo.png" alt="Shatrunjay" className="h-9 rounded bg-white/95 p-0.5" />
        <button onClick={() => setOpen(!open)} className="rounded p-2 text-white" aria-expanded={open} aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </div>
      <aside className={`${open ? "block" : "hidden"} bg-kadhai text-white/80 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col`}>
        <div className="hidden px-5 pb-4 pt-6 md:block">
          <Link href="/admin" className="block rounded-lg bg-[#fffaf0] px-3 py-2.5 shadow-inner">
            <img src="/brand/logo.png" alt="Shatrunjay" className="mx-auto h-16" />
          </Link>
          <p className="mt-3 text-center text-xs text-white/50">Shop admin</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2 md:py-0">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n.href) ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active(n.href) ? "bg-kadhai-2 font-semibold text-white" : "hover:bg-white/5 hover:text-white"}`}>
              {active(n.href) && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-ghee" />}
              <span className={active(n.href) ? "text-ghee" : ""}>{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              {n.href === "/admin/orders" && waiting > 0 && <span className="rounded-full bg-ghee px-1.5 text-[11px] font-bold text-kadhai" title={`${waiting} new orders`}>{waiting}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs">
          <p className="font-medium text-white/90">Shatrunjay Foodstuffs Pvt Ltd</p>
          <div className="mt-2 flex gap-4">
            <a href="/" target="_blank" className="hover:text-ghee">View website</a>
            <button className="hover:text-ghee" onClick={async () => { await fetch("/admin/api/session", { method: "DELETE" }); window.location.assign("/"); }}>Sign out</button>
          </div>
        </div>
      </aside>
    </>
  );
}

