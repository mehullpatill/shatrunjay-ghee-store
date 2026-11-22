import InquiryForm from "@/components/InquiryForm";

export const metadata = {
  title: "Wholesale Enquiries — Shatrunjay Ghee",
};

export default function WholesalePage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-maroon">Trade & retail</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-kadhai">Wholesale & Distribution</h1>
        <p className="mt-3 text-lg text-muted">
          Partner with Shatrunjay Foodstuffs Private Limited for grocery stores, mithai kitchens, restaurants, and regional distribution across India.
        </p>
      </div>
      <InquiryForm
        type="WHOLESALE"
        title="Send a wholesale inquiry"
        note="Share your store or business name, city, and monthly requirement."
      />
    </div>
  );
}
