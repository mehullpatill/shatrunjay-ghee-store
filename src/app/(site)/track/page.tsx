import type { Metadata } from "next";
import { formatRupees } from "@/lib/pricing";
import { leadr } from "@/lib/leadr";

export const metadata: Metadata = { title: "Track your order" };

type TrackedOrder = {
  order_number: string;
  status: string;
  total_paise: number;
  items: Array<{ name: string; quantity: number }>;
};

const STEPS: Array<[string, string]> = [
  ["pending", "Order placed"],
  ["confirmed", "Confirmed"],
  ["processing", "Packing"],
  ["shipped", "On the way"],
  ["delivered", "Delivered"],
];

const STOPPED: Record<string, string> = {
  cancelled: "This order was cancelled.",
  payment_failed: "The payment did not go through, so this order was not placed.",
  payment_pending: "We are waiting for your payment to complete.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; phone?: string }>;
}) {
  const { order, phone } = await searchParams;
  let found: TrackedOrder | null = null;
  if (order && phone) {
    const response = await leadr(`/storefront/orders/${encodeURIComponent(order)}?phone=${encodeURIComponent(phone)}`).catch(() => null);
    if (response?.ok) found = (await response.json()) as TrackedOrder;
  }
  const activeStep = found ? STEPS.findIndex(([status]) => status === found.status) : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-bold text-kadhai">Track your order</h1>
      {found ? (
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 md:p-8">
          <p className="text-sm text-muted">Order</p>
          <p className="font-display text-2xl font-bold text-kadhai">{found.order_number}</p>
          {activeStep >= 0 ? (
            <ol className="mt-8 grid grid-cols-5 gap-1" aria-label="Order progress">
              {STEPS.map(([status, label], index) => (
                <li key={status} aria-current={index === activeStep ? "step" : undefined} className="text-center">
                  <span className={`block h-1.5 rounded-full ${index <= activeStep ? "bg-label" : "bg-line"}`} />
                  <span className={`mt-2 block text-[11px] sm:text-xs ${index === activeStep ? "font-bold text-label" : index < activeStep ? "text-ink" : "text-muted"}`}>{label}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 rounded-xl bg-[#f8eaea] px-4 py-3 text-sm text-maroon">{STOPPED[found.status] ?? `Status: ${found.status.replace(/_/g, " ")}`}</p>
          )}
          <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
            {found.items.map((item) => <li key={item.name} className="flex justify-between py-3"><span>{item.name}</span><span className="text-muted">× {item.quantity}</span></li>)}
          </ul>
          <p className="mt-4 flex justify-between font-bold"><span>Total</span><span>{formatRupees(found.total_paise)}</span></p>
        </div>
      ) : (
        <p className="mt-2 text-muted">Enter the order number and phone number used for the order.</p>
      )}
      {order && phone && !found && <p role="alert" className="mt-6 rounded-xl bg-[#f8eaea] px-4 py-3 text-sm text-maroon">We could not find that order.</p>}
      <form className={`grid gap-3 sm:grid-cols-[1fr_1fr_auto] ${found ? "mt-10" : "mt-6"}`}>
        <input name="order" defaultValue={order} required placeholder="Order number, e.g. WEB-0012" className="field py-3" />
        <input name="phone" defaultValue={phone} required inputMode="tel" placeholder="Phone used for the order" className="field py-3" />
        <button className="btn">Track</button>
      </form>
    </div>
  );
}
