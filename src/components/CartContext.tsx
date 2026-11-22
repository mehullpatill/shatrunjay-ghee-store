"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatRupees } from "@/lib/pricing";

export interface CartItemClient {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  pricePaise: number;
  mrpPaise: number;
  imageUrl: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItemClient[];
  totalCount: number;
  subtotalPaise: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItemClient, "quantity">, qty?: number) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  syncWithServerAfterLogin: () => Promise<void>;
}

const STORAGE_KEY = "sj_guest_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemClient[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItemClient[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore invalid storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!drawerOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
      if (event.key === "Tab") {
        const panel = document.getElementById("cart-drawer-panel");
        const focusable = panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [drawerOpen]);

  const syncWithServerAfterLogin = async () => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "merge",
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { items?: CartItemClient[] };
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
      }
    } catch {
      // keep local items if sync fails
    }
  };

  const pushReplaceToServer = (nextItems: CartItemClient[]) => {
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "replace",
        items: nextItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      }),
    }).catch(() => {});
  };

  const addItem = (item: Omit<CartItemClient, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      const next = existing
        ? prev.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: Math.min(50, i.quantity + qty) } : i
          )
        : [...prev, { ...item, quantity: Math.min(50, qty) }];
      pushReplaceToServer(next);
      return next;
    });
    setDrawerOpen(true);
  };

  const updateQty = (variantId: string, qty: number) => {
    setItems((prev) => {
      const next =
        qty <= 0
          ? prev.filter((i) => i.variantId !== variantId)
          : prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(50, qty) } : i));
      pushReplaceToServer(next);
      return next;
    });
  };

  const removeItem = (variantId: string) => {
    updateQty(variantId, 0);
  };

  const clearCart = () => {
    setItems([]);
    pushReplaceToServer([]);
  };

  const totalCount = useMemo(() => items.reduce((acc, i) => acc + i.quantity, 0), [items]);
  const subtotalPaise = useMemo(
    () => items.reduce((acc, i) => acc + i.pricePaise * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotalPaise,
        drawerOpen,
        setDrawerOpen,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        syncWithServerAfterLogin,
      }}
    >
      {children}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]" onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
          <div id="cart-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" className="flex h-full w-full max-w-md flex-col bg-[#fffdf8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 id="cart-drawer-title" className="font-display text-lg font-bold text-kadhai">Your Cart ({totalCount})</h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close cart"
                className="rounded-full p-2 text-muted hover:bg-butter hover:text-kadhai"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted">Your cart is empty.</p>
                  <Link href="/shop" onClick={() => setDrawerOpen(false)} className="btn mt-4">
                    Browse Products
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-20 w-20 shrink-0 rounded-xl bg-butter object-contain p-1.5 pack"
                    />
                    <div className="flex flex-1 flex-col">
                      <Link
                        href={`/product/${item.productSlug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="font-semibold text-kadhai hover:text-maroon"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-xs text-muted">{item.variantLabel}</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-bold text-ink">{formatRupees(item.pricePaise * item.quantity)}</span>
                        <div className="flex items-center gap-2 rounded-full border border-line px-2 py-0.5 text-sm">
                          <button type="button" onClick={() => updateQty(item.variantId, item.quantity - 1)} aria-label="Decrease quantity">
                            −
                          </button>
                          <span className="min-w-[1.2rem] text-center font-medium">{item.quantity}</span>
                          <button type="button" onClick={() => updateQty(item.variantId, item.quantity + 1)} aria-label="Increase quantity">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-line bg-white p-5">
                <div className="flex items-center justify-between text-base font-bold text-kadhai">
                  <span>Subtotal</span>
                  <span>{formatRupees(subtotalPaise)}</span>
                </div>
                <p className="mt-1 text-xs text-label font-medium">Free Home Delivery • Safe & Secure Packaging</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link href="/cart" onClick={() => setDrawerOpen(false)} className="btn-ghost text-center">
                    View Cart
                  </Link>
                  <Link href="/checkout" onClick={() => setDrawerOpen(false)} className="btn text-center">
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
