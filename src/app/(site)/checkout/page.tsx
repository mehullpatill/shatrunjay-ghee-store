import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { getProducts, getSite } from "@/lib/leadr";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [products, site] = await Promise.all([getProducts(), getSite()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="mb-8 text-4xl font-bold text-kadhai">Checkout</h1>
      {site ? <CheckoutForm products={products} site={site} /> : <p>Checkout is unavailable right now. Please try again shortly.</p>}
    </div>
  );
}
