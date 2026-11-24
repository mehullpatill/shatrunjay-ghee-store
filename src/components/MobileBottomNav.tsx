"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";
import { BagIcon, GridIcon, HomeIcon, MenuIcon, UserIcon } from "./icons";

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

const BOTTOM_ITEMS = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Categories", href: "/shop", icon: GridIcon },
  { label: "Account", href: "/account", icon: UserIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/shop") return ["/shop", "/ghee", "/groundnut-oil"].some((p) => pathname.startsWith(p));
  return pathname.startsWith(href);
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on outside tap (the backdrop)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* ---- Bottom tab bar ---- */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-4px_16px_rgba(40,24,10,0.12)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {BOTTOM_ITEMS.slice(0, 2).map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
                  active ? "text-maroon" : "text-muted hover:text-maroon"
                }`}
              >
                <Icon size={21} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Cart tab */}
          <Link
            href="/cart"
            aria-current={pathname.startsWith("/cart") || pathname.startsWith("/checkout") ? "page" : undefined}
            className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
              pathname.startsWith("/cart") || pathname.startsWith("/checkout") ? "text-maroon" : "text-muted hover:text-maroon"
            }`}
          >
            <span className="relative">
              <BagIcon size={21} />
              {totalCount > 0 && (
                <span className="absolute -right-3 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[9px] font-bold text-white">
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </span>
            <span>Cart</span>
          </Link>

          {/* Account tab */}
          {BOTTOM_ITEMS.slice(2).map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
                  active ? "text-maroon" : "text-muted hover:text-maroon"
                }`}
              >
                <Icon size={21} />
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Menu tab — opens bottom sheet */}
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
              open ? "text-maroon" : "text-muted hover:text-maroon"
            }`}
          >
            <MenuIcon size={21} />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* ---- Bottom-sheet menu ---- */}
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Sheet panel — slides up from bottom */}
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-[#fffdf8] shadow-2xl transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom)] ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-line" />
          </div>

          {/* Close button */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-line">
            <span className="font-display text-base font-bold text-kadhai">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-1.5 text-muted hover:bg-paper hover:text-kadhai"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="px-5 py-2">
            {NAV.map(([label, href]) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 border-b border-line/50 py-3.5 text-sm font-medium transition-colors hover:text-maroon ${
                    active ? "font-semibold text-maroon" : "text-ink"
                  }`}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-maroon shrink-0" />}
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
