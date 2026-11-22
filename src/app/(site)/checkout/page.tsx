import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/cms";
import { prisma } from "@/lib/prisma";
import CheckoutClient from "@/components/CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
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
      />
    </div>
  );
}
