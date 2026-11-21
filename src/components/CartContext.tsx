"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartItemDTO {
  id: string;
  productId: string;
  sku: string;
  name: string;
  slug: string;
  volumeLabel: string | null;
  priceInr: number;
  imagesJson: string[];
  quantity: number;
  lineTotalInr: number;
}

export interface CartDTO {
  id: string;
  status: string;
  lockedUntil: string | null;
  appliedCode: string | null;
  discountReason: string | null;
  emailForRecovery: string | null;
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  items: CartItemDTO[];
}

interface CartContextValue {
  cart: CartDTO | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  updateItem: (productId: string, quantity: number, mode?: "set" | "increment") => Promise<string | null>;
  applyCode: (code: string | null) => Promise<void>;
  setRecoveryEmail: (email: string, name?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const updateItem = async (
    productId: string,
    quantity: number,
    mode: "set" | "increment" = "set"
  ): Promise<string | null> => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity, mode }),
    });
    const data = await res.json();
    if (!res.ok) {
      return data.error || "Unable to update cart";
    }
    setCart(data.cart);
    return null;
  };

  const applyCode = async (code: string | null) => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
    }
  };

  const setRecoveryEmail = async (email: string, customerName?: string) => {
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailForRecovery: email, customerName }),
    });
  };

  const clearCart = async () => {
    const res = await fetch("/api/cart", { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
    }
  };

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        refreshCart,
        updateItem,
        applyCode,
        setRecoveryEmail,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
