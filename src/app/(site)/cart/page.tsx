import type { Metadata } from "next";
import CartView from "@/components/CartView";
import { getProducts } from "@/lib/leadr";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  return <div className="mx-auto max-w-6xl px-4 py-10 md:px-6"><h1 className="mb-6 text-4xl font-bold text-kadhai">Your cart</h1><CartView products={await getProducts()} /></div>;
}
