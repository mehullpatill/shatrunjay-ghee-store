"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, MessageCircle, Menu, X, Plus, Minus, Trash2, User } from "lucide-react";
import { useCart } from "./CartContext";

interface NavLink {
  label: string;
  href: string;
}

interface HeaderProps {
  settings: {
    brandNameHindi: string;
    brandNameEnglish: string;
    hindiLogoUrl: string | null;
    englishLogoUrl: string | null;
    whatsappNumber: string;
    navLinksJson: unknown;
  } | null;
  movingItems: Array<{ id: string; textWithEmoji: string; linkUrl: string | null }>;
}

export function Header({ settings, movingItems }: HeaderProps) {
  const { cart, itemCount, isDrawerOpen, openDrawer, closeDrawer, updateItem, applyCode } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => {});
  }, []);

  const navLinks: NavLink[] = Array.isArray(settings?.navLinksJson) && settings.navLinksJson.length > 0
    ? (settings.navLinksJson as NavLink[])
    : [
        { label: "Shop All", href: "/shop" },
        { label: "Ghee", href: "/ghee" },
        { label: "Groundnut Oil", href: "/groundnut-oil" },
        { label: "Derasar", href: "/derasar" },
        { label: "Ghee Laabh Yojna", href: "/ghee-laabh-yojna" },
        { label: "Lab Reports", href: "/lab-reports" },
        { label: "Our Story", href: "/our-story" },
        { label: "Contact", href: "/contact" },
      ];

  const whatsappDigits = (settings?.whatsappNumber || "+91 81696 29908").replace(/[^\d]/g, "");
  const whatsappUrl = `https://wa.me/${whatsappDigits}`;

  return (
    <>
      {movingItems.length > 0 && (
        <div className="overflow-hidden bg-espresso py-2 text-xs font-medium text-cream">
          <div className="animate-marquee gap-12">
            {[...movingItems, ...movingItems].map((item, i) => (
              <span key={`${item.id}-${i}`} className="mx-6 inline-flex items-center gap-2">
                {item.linkUrl ? (
                  <Link href={item.linkUrl} className="hover:text-ghee-light transition">
                    {item.textWithEmoji}
                  </Link>
                ) : (
                  <span>{item.textWithEmoji}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-espresso/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              {settings?.hindiLogoUrl ? (
                <img src={settings.hindiLogoUrl} alt={settings.brandNameHindi} className="h-10 w-auto object-contain" />
              ) : (
                <span className="rounded-xl border-2 border-ghee bg-white px-2.5 py-1 font-serif text-base font-bold text-espresso shadow-sm">
                  {settings?.brandNameHindi || "शत्रुंजय"}
                </span>
              )}
              {settings?.englishLogoUrl ? (
                <img src={settings.englishLogoUrl} alt={settings.brandNameEnglish} className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-serif text-xl font-bold tracking-tight text-espresso">
                  {settings?.brandNameEnglish || "Shatrunjay"}
                </span>
              )}
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1 text-xs font-semibold text-leaf transition hover:bg-leaf hover:text-white md:inline-flex"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {settings?.whatsappNumber || "+91 81696 29908"}
            </a>
          </div>

          <nav className="hidden items-center gap-5 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-espresso/85 transition hover:text-ghee-dark"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href={user.role === "ADMIN" ? "/admin" : "/account"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-espresso/15 bg-white px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-cream-soft"
                >
                  <User className="h-3.5 w-3.5 text-ghee-dark" />
                  {user.role === "ADMIN" ? "Admin Panel" : user.name.split(" ")[0]}
                </Link>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/login" className="text-xs font-semibold text-espresso hover:text-ghee-dark">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-espresso px-3.5 py-1.5 text-xs font-semibold text-cream hover:bg-espresso-light"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={openDrawer}
              aria-label="Open cart"
              className="relative inline-flex items-center gap-1.5 rounded-full border border-espresso/15 bg-white px-3 py-1.5 text-xs font-semibold text-espresso shadow-sm hover:bg-cream-soft"
            >
              <ShoppingBag className="h-4 w-4 text-ghee-dark" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ghee px-1 text-[11px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-espresso xl:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-espresso/10 bg-cream px-4 py-4 xl:hidden">
            <div className="flex flex-col space-y-2.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-1.5 text-sm font-medium text-espresso hover:bg-cream-soft"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-leaf"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp: {settings?.whatsappNumber || "+91 81696 29908"}
              </a>
              <div className="flex gap-3 pt-2 border-t border-espresso/10">
                {user ? (
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-espresso">
                    My Account
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-espresso">
                      Log In
                    </Link>
                    <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-ghee-dark">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-espresso/50 backdrop-blur-xs">
          <div className="flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-espresso/10 px-5 py-4">
              <h2 className="font-serif text-lg font-bold text-espresso">Your Cart ({itemCount})</h2>
              <button onClick={closeDrawer} className="rounded-lg p-1.5 text-espresso hover:bg-cream-soft">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!cart || cart.items.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-taupe/50" />
                  <p className="mt-3 text-sm font-medium text-taupe">Your cart is empty.</p>
                  <Link
                    href="/shop"
                    onClick={closeDrawer}
                    className="mt-4 inline-block rounded-xl bg-espresso px-5 py-2.5 text-xs font-semibold text-cream"
                  >
                    Shop Pure Ghee & Oil
                  </Link>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-espresso/10 bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-espresso">{item.name}</p>
                      <p className="text-xs text-taupe">
                        ₹{item.priceInr.toLocaleString("en-IN")} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItem(item.productId, item.quantity - 1)}
                        className="rounded-lg border border-espresso/15 p-1 text-espresso hover:bg-cream-soft"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.productId, item.quantity + 1)}
                        className="rounded-lg border border-espresso/15 p-1 text-espresso hover:bg-cream-soft"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => updateItem(item.productId, 0)}
                        className="ml-1 rounded-lg p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart && cart.items.length > 0 && (
              <div className="border-t border-espresso/10 bg-white p-5 space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCode(codeInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Promo / Coupon / Referral Code"
                    className="flex-1 rounded-xl border border-espresso/20 px-3 py-2 text-xs uppercase focus:border-ghee focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-cream-warm px-3.5 py-2 text-xs font-semibold text-espresso hover:bg-ghee hover:text-white"
                  >
                    Apply
                  </button>
                </form>
                {cart.discountReason && <p className="text-xs text-red-600">{cart.discountReason}</p>}
                {cart.appliedCode && (
                  <div className="flex items-center justify-between text-xs text-leaf font-semibold">
                    <span>Code {cart.appliedCode} applied (-₹{cart.discountInr})</span>
                    <button onClick={() => applyCode(null)} className="underline">Remove</button>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm font-bold text-espresso">
                  <span>Total</span>
                  <span>₹{cart.totalInr.toLocaleString("en-IN")}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="block w-full rounded-xl bg-espresso py-3 text-center text-sm font-semibold text-cream transition hover:bg-espresso-light"
                >
                  Proceed to Secure Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
