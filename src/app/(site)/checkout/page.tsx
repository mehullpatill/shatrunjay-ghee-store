import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/cms";
import { prisma } from "@/lib/prisma";
import CheckoutClient from "@/components/CheckoutClient";
import LeadrCheckoutClient from "@/components/LeadrCheckoutClient";
import { getCommerceProducts } from "@/lib/commerce";
import { getLeadrSite } from "@/lib/leadr";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  if (getEnv().COMMERCE_BACKEND === "leadr") {
    const [site, products] = await Promise.all([getLeadrSite(), getCommerceProducts()]);
    return <div className="mx-auto max-w-6xl px-4 py-12 md:px-6"><h1 className="mb-8 text-4xl font-extrabold text-kadhai">Checkout</h1>{site ? <LeadrCheckoutClient site={site} products={products} /> : <p>Checkout is unavailable right now. Please try again shortly.</p>}</div>;
  }
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  const savedAddresses = user
    ? await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="mb-8 text-4xl font-extrabold text-kadhai">Checkout</h1>
      <CheckoutClient
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                phone: user.phone,
                emailVerified: Boolean(user.emailVerifiedAt),
              }
            : null
        }
        savedAddresses={savedAddresses}
        checkoutNotes={settings.checkoutNotes}
        razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""}
        commerceBackend={process.env.NEXT_PUBLIC_COMMERCE_BACKEND || process.env.COMMERCE_BACKEND || "prisma"}
      />
    </div>
  );
}
