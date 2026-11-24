import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/cms";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/pricing";
import AccountClient from "@/components/AccountClient";
import AddressBook from "@/components/AddressBook";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/account");

  const [orders, addresses, settings] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-extrabold text-kadhai">My Account</h1>
      {!user.emailVerifiedAt && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Your email is not verified yet. Please verify your email before placing orders.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        {/* Left column — orders + address book */}
        <div className="space-y-8">
          {/* Orders */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-kadhai">My Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="rounded-3xl border border-line bg-white p-8 text-center">
                <p className="text-muted">You haven&apos;t placed any orders yet.</p>
                <Link href="/shop" className="btn mt-4">Shop Pure Ghee</Link>
              </div>
            ) : (
              orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block rounded-3xl border border-line bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-kadhai">{order.orderNumber}</p>
                      <p className="text-xs text-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {" • "}
                        {order.paymentMethod} ({order.paymentStatus})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-butter px-3 py-1 text-xs font-bold text-kadhai">
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <p className="mt-1 font-bold text-maroon">{formatRupees(order.totalPaise)}</p>
                    </div>
                  </div>
                  {order.trackingNumber && (
                    <p className="mt-2 text-xs text-label font-medium">
                      Courier: {order.courierName || "Assigned"} • Tracking: {order.trackingNumber}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Address book */}
          <AddressBook initialAddresses={addresses} />
        </div>

        {/* Right column — profile + referral */}
        <AccountClient
          user={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            referralCode: user.referralCode,
            emailVerified: Boolean(user.emailVerifiedAt),
          }}
          referralEnabled={settings.referralEnabled}
        />
      </div>
    </div>
  );
}
