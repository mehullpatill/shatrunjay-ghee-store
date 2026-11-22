import Link from "next/link";

export const metadata = {
  title: "Lab Reports & Purity Testing — Shatrunjay Ghee",
};

export default function LabReportsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-maroon">Purity & testing</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-kadhai">Batch-level Lab Reports</h1>
        <p className="mt-3 text-lg text-muted">
          Every batch of Shatrunjay Pure Cow Ghee, Pure Buffalo Ghee, and A2 Gir Cow Ghee is tested for moisture, Reichert-Meissl (RM) value, Polenske value, and zero adulteration before packing.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6">
          <h2 className="font-display text-xl font-bold text-kadhai">FSSAI & AGMARK Standards</h2>
          <p className="mt-2 text-sm text-muted">
            FSSAI License: <strong>11524002000134</strong> · GSTIN: <strong>27ABICS5067M1ZO</strong>.
            All batches meet strict milk-fat purity benchmarks with zero vegetable oil or vanaspati blending.
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6">
          <h2 className="font-display text-xl font-bold text-kadhai">Request a Batch Certificate</h2>
          <p className="mt-2 text-sm text-muted">
            Need the lab certificate for your jar’s batch number or for temple / institutional verification? Write to{" "}
            <a href="mailto:info@shatrunjayghee.com" className="font-semibold text-maroon underline">
              info@shatrunjayghee.com
            </a>{" "}
            or message us on WhatsApp.
          </p>
        </div>
      </div>

      <Link href="/shop" className="btn inline-block">
        Shop lab-tested ghee
      </Link>
    </div>
  );
}
