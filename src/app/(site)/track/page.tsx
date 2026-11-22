import type { Metadata } from "next";
import { rupees } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Track your order" };

const STEPS: [string, string][] = [
  ["PLACED", "Order placed"],
  ["CONFIRMED", "Confirmed"],
  ["PACKED", "Packing"],
  ["DISPATCHED", "On the way"],
  ["DELIVERED", "Delivered"],
];

export default async function Track({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const { order, phone } = await searchParams;
  let found: {
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    totalInr: number;
    deliveryEtaText: string;
    courierName: string | null;
    trackingNumber: string | null;
    items: { id: string; productName: string; quantity: number }[];
  } | null = null;

  if (order && phone) {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const rec = await prisma.order.findUnique({
      where: { orderNumber: order.trim() },
      include: { items: true },
    });
    if (rec && (!cleanPhone || rec.customerPhone.replace(/\D/g, "").endsWith(cleanPhone))) {
      found = rec;
    }
  }

  const at = found ? STEPS.findIndex(([s]) => s === found!.orderStatus) : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-bold text-kadhai">Track your order</h1>
      {found ? (
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 md:p-8">
          <p className="text-sm text-muted">Order</p>
          <p className="font-display text-2xl font-bold text-kadhai">{found.orderNumber}</p>
          <p className="mt-1 text-xs text-label">{found.deliveryEtaText}</p>
          {at >= 0 ? (
            <ol className="mt-8 grid grid-cols-5 gap-1" aria-label="Order progress">
              {STEPS.map(([s, label], i) => (
                <li key={s} aria-current={i === at ? "step" : undefined} className="text-center">
                  <span className={`block h-1.5 rounded-full ${i <= at ? "bg-label" : "bg-line"}`} />
                  <span className={`mt-2 block text-[11px] sm:text-xs ${i === at ? "font-bold text-label" : i < at ? "text-ink" : "text-muted"}`}>{label}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 rounded-xl bg-[#f8eaea] px-4 py-3 text-sm text-maroon">
              {found.orderStatus === "CANCELLED" ? "This order was cancelled." : `Status: ${found.orderStatus}`}
            </p>
          )}
          {found.courierName && (
            <p className="mt-4 text-sm text-kadhai">
              Courier: <strong>{found.courierName}</strong>
              {found.trackingNumber ? ` · AWB: ${found.trackingNumber}` : ""}
            </p>
          )}
          <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
            {found.items.map((i) => (
              <li key={i.id} className="flex justify-between py-3">
                <span>{i.productName}</span>
                <span className="text-muted">× {i.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between font-bold">
            <span>Total</span>
            <span>{rupees(found.totalInr * 100)}</span>
          </p>
        </div>
      ) : (
        <p className="mt-2 text-muted">Enter the order number from your order confirmation and the phone number you ordered with.</p>
      )}
      {order && phone && !found && (
        <p role="alert" className="mt-6 rounded-xl bg-[#f8eaea] px-4 py-3 text-sm text-maroon">
          We could not find that order. Check the order number and the phone number.
        </p>
      )}
      <form className={`grid gap-3 sm:grid-cols-[1fr_1fr_auto] ${found ? "mt-10" : "mt-6"}`}>
        <label>
          <span className="sr-only">Order number</span>
          <input name="order" defaultValue={order} required placeholder="Order number, e.g. WEB-0012" className="field py-3" />
        </label>
        <label>
          <span className="sr-only">Phone</span>
          <input name="phone" defaultValue={phone} required inputMode="tel" placeholder="Phone used for the order" className="field py-3" />
        </label>
        <button className="btn">Track</button>
      </form>
    </div>
  );
}
