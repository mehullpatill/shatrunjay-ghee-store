import InquiryForm from "@/components/InquiryForm";

export const metadata = {
  title: "Bulk Orders — Shatrunjay Ghee",
};

export default function BulkOrderPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-maroon">Events, catering & 15 Kg tins</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-kadhai">Bulk Orders</h1>
        <p className="mt-3 text-lg text-muted">
          Ordering 15 Kg tins or multi-jar hampers for weddings, community kitchens, corporate gifting, or temple events? Request direct dispatch pricing below.
        </p>
      </div>
      <InquiryForm
        type="BULK"
        title="Request bulk pricing"
        note="Tell us the ghee variety, pack size (5 Ltr / 15 Kg tin), quantity, and delivery pincode."
      />
    </div>
  );
}
