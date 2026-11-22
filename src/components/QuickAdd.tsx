"use client";
import { useState } from "react";
import { addToCart } from "./cart";

export default function QuickAdd({ id, name }: { id: string; name: string }) {
  const [added, setAdded] = useState(false);
  return (
    <button aria-label={`Add ${name} to cart`} onClick={() => { addToCart(id); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${added ? "border-leaf bg-leaf text-white" : "border-maroon text-maroon hover:bg-maroon hover:text-white"}`}>
      <span aria-live="polite">{added ? "Added" : "Add"}</span>
    </button>
  );
}
