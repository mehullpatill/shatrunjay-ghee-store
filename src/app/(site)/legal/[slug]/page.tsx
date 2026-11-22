import { notFound } from "next/navigation";

const PAGES: Record<string, { title: string; body: string[] }> = {
  "privacy-policy": {
    title: "Privacy Policy",
    body: [
      "Shatrunjay Foodstuffs Private Limited respects your privacy. We collect only the details needed to process your order, verify guest checkout via email OTP, and send order status updates.",
      "Online payments are processed securely through Razorpay. We never store your card or UPI credentials on our servers.",
      "For privacy requests, email info@shatrunjayghee.com.",
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    body: [
      "All orders placed on shatrunjayghee.com are fulfilled by Shatrunjay Foodstuffs Private Limited (Shop no 7, Ground Floor, Shubham Lifescapes Amrut, V. P. Road, Girgaon, Charni Road East, Mumbai 400004).",
      "Prices are inclusive of applicable taxes. Cash on Delivery is available only for eligible pincodes configured in our system.",
    ],
  },
  "shipping-refund": {
    title: "Shipping & Refund Policy",
    body: [
      "Delivery timeline: 2–3 days in Mumbai; 5–7 working days outside Mumbai.",
      "If a jar or tin arrives damaged or leaking, share a photo within 48 hours of delivery to info@shatrunjayghee.com or +91 81696 29908 for a replacement or refund.",
    ],
  },
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 space-y-5">
      <h1 className="font-display text-3xl font-bold text-kadhai">{page.title}</h1>
      {page.body.map((p, i) => (
        <p key={i} className="leading-relaxed text-muted">
          {p}
        </p>
      ))}
    </div>
  );
}
