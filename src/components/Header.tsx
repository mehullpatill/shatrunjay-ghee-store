"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import { BagIcon, WhatsAppIcon } from "./icons";

const NAV: [string, string][] = [
  ["Shop All", "/shop"],
  ["Ghee", "/ghee"],
  ["Groundnut Oil", "/groundnut-oil"],
  ["Derasar", "/derasar"],
  ["Ghee Laabh Yojna", "/ghee-laabh-yojna"],
  ["Lab Reports", "/lab-reports"],
  ["Our Story", "/our-story"],
  ["Contact", "/contact"],
];

export default function Header({
  user,
  whatsappEnabled,
  whatsappNumber,
}: {
  user: { name: string; role: string } | null;
  whatsappEnabled: boolean;
  whatsappNumber: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { totalCount, setDrawerOpen } = useCart();

  useEffect(() => {
    const toggleMenu = () => setOpen((current) => !current);
    window.addEventListener("sj:toggle-mobile-menu", toggleMenu);
    return () => window.removeEventListener("sj:toggle-mobile-menu", toggleMenu);
  }, []);

  const on = (h: string) => (h === "/" ? path === h : path.startsWith(h));
  const cleanWa = whatsappNumber.replace(/\D/g, "");
  const waHref = `https://wa.me/${cleanWa.length === 10 ? "91" + cleanWa : cleanWa}`;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[#fffdf8]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 md:px-6">
        <Link href="/" aria-label="Shatrunjay Ghee homepage" className="flex shrink-0 items-center gap-2.5">
          <img src="/brand/logo.png" alt="Shatrunjay Hindi Logo" className="h-11 md:h-13" />
          <span className="font-display text-lg font-extrabold tracking-tight text-kadhai md:text-xl">
            Shatrunjay
          </span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center gap-5 text-sm font-medium xl:flex">
          {NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={on(href) ? "page" : undefined}
              className={`whitespace-nowrap py-2 transition-colors hover:text-maroon ${
                on(href) ? "font-semibold text-maroon" : "text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {whatsappEnabled && cleanWa && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Shatrunjay"
              className="hidden rounded-full p-2 text-[#1fa855] hover:bg-butter sm:inline-flex"
            >
              <WhatsAppIcon size={20} />
            </a>
          )}

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              {user.role === "ADMIN" && (
                <Link href="/admin" className="rounded-full bg-ghee-soft px-3 py-1.5 text-xs font-semibold text-kadhai hover:bg-ghee/30">
                  Admin
                </Link>
              )}
              <Link href="/account" className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-kadhai hover:border-maroon hover:text-maroon">
                Account ({user.name.split(" ")[0]})
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-medium text-kadhai hover:text-maroon">
                Log In
              </Link>
              <Link href="/signup" className="rounded-full bg-maroon px-4 py-1.5 text-sm font-semibold text-white hover:bg-maroon-dark">
                Sign Up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Open cart (${totalCount} items)`}
            className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-kadhai hover:border-maroon hover:text-maroon"
          >
            <BagIcon size={18} />
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-[11px] font-bold text-white">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            className="rounded-full p-2 xl:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile navigation" className="border-t border-line bg-[#fffdf8] px-4 pb-4 xl:hidden">
          {NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block border-b border-line/60 py-3 text-sm font-medium text-ink hover:text-maroon"
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 flex flex-wrap gap-2">
            {user ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="btn-ghost text-xs">
                  My Account
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="btn text-xs">
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost text-xs">
                  Log In
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="btn text-xs">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
