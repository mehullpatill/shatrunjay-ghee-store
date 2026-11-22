"use client";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatRupees } from "@/lib/pricing";

export default function CartPage() {
  const { items, subtotalPaise, updateQty, removeItem } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-extrabold text-kadhai">Your Cart</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-butter p-10 text-center">
          <p className="text-lg font-semibold text-kadhai">Your cart is empty.</p>
          <Link href="/shop" className="btn mt-4">Shop Pure Ghee</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-4 rounded-3xl border border-line bg-white p-4">
                <img src={item.imageUrl} alt={item.productName} className="h-24 w-24 rounded-2xl bg-butter object-contain p-2 pack" />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/product/${item.productSlug}`} className="font-bold text-kadhai hover:text-maroon">
                        {item.productName}
                      </Link>
                      <p className="text-xs text-muted">{item.variantLabel}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.variantId)} className="text-xs text-muted hover:text-maroon">
                      Remove
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-3 rounded-full border border-line px-3 py-1 text-sm">
                      <button type="button" onClick={() => updateQty(item.variantId, item.quantity - 1)}>−</button>
                      <span className="font-semibold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.variantId, item.quantity + 1)}>+</button>
                    </div>
                    <span className="text-lg font-bold text-kadhai">{formatRupees(item.pricePaise * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-3xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold text-kadhai">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatRupees(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className="font-semibold text-label">Free Home Delivery</span>
              </div>
              <p className="text-xs text-muted pt-1">
                Mumbai: 2–3 days • Outside Mumbai: 5–7 working days
              </p>
            </div>
            <div className="mt-4 border-t border-line pt-4 flex justify-between text-lg font-extrabold text-kadhai">
              <span>Total</span>
              <span>{formatRupees(subtotalPaise)}</span>
            </div>
            <Link href="/checkout" className="btn mt-6 w-full text-center">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
