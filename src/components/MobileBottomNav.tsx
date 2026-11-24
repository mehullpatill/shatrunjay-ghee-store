"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { BagIcon, GridIcon, HomeIcon, MenuIcon, UserIcon } from "./icons";

const ITEMS = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Categories", href: "/shop", icon: GridIcon },
  { label: "Account", href: "/account", icon: UserIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/shop") return ["/shop", "/ghee", "/groundnut-oil"].some((path) => pathname.startsWith(path));
  return pathname.startsWith(href);
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalCount } = useCart();

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-4px_16px_rgba(40,24,10,0.12)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.slice(0, 2).map(({ label, href, icon: Icon }) => {
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
        {ITEMS.slice(2).map(({ label, href, icon: Icon }) => {
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
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => window.dispatchEvent(new Event("sj:toggle-mobile-menu"))}
          className="flex min-h-[64px] flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted transition-colors hover:text-maroon"
        >
          <MenuIcon size={21} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
