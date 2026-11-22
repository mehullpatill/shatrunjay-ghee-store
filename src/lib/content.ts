import { getSite } from "./leadr";

export type SiteContent = {
  announcement: string; hero_title: string; hero_subtitle: string; about: string; phone: string; email: string;
  address: string; gstin: string; fssai: string; faq: { q: string; a: string }[];
};
export const DEFAULT_CONTENT: SiteContent = {
  announcement: "We have recently launched Shatrunjay A2 Desi Cow Ghee. Free delivery across Mumbai.",
  hero_title: "Ghee the way your grandmother made it",
  hero_subtitle: "Desi cow milk, set into curd, churned by bilona and slowly simmered into golden, granular ghee. Made in small batches in Mumbai.",
  about: "Shatrunjay Foodstuffs is a Mumbai family business making pure cow, buffalo and A2 Gir cow ghee. Our A2 ghee follows the Bilona way: desi cow milk is set into curd, churned into makkhan and simmered slowly until it turns golden and granular.",
  phone: "81696 29908",
  email: "info@shatrunjayghee.com",
  address: "Shop no 7, Ground Floor, Shubham Lifescapes Amrut, V. P. Road, Girgaon, Charni Road East, Mumbai 400004",
  gstin: "27ABICS5067M1ZO",
  fssai: "11524002000134",
  faq: [
    { q: "What is A2 Gir cow ghee?", a: "Ghee made only from the milk of desi Gir cows, which carries the A2 type of protein. We make it by the Bilona method: curd is churned into makkhan, then simmered slowly into ghee." },
    { q: "How is it different from regular cow ghee?", a: "Regular cow ghee is made from cream. Bilona ghee is made from curd-churned makkhan, which takes far more milk per litre and gives a richer aroma and a granular texture." },
    { q: "How long does delivery take?", a: "Within Mumbai, usually 2–3 days from order confirmation. Outside Mumbai it takes 5–7 working days." },
    { q: "Can I pay on delivery?", a: "Yes, cash on delivery is available for eligible pincodes. You can also pay online by UPI, card, or net banking via Razorpay." },
    { q: "Do you supply derasars, temples and bhojanshalas?", a: "Yes. We supply bulk ghee for pooja, aarti, prasad and every dharmik anushthan at special rates. Call or WhatsApp us for a quote." },
    { q: "How should I store ghee?", a: "Keep the lid tightly closed, away from moisture and direct sunlight, and always use a dry spoon. It does not need a fridge." },
  ],
};

export const SOCIAL = {
  instagram: "https://www.instagram.com/shatrunjayghee",
  facebook: "https://www.facebook.com/share/1DSKgP2jVJ/",
  youtube: "https://youtube.com/@shatrunjayghee",
};

export function waLink(phone: string, text?: string) {
  const d = phone.replace(/\D/g, "");
  return `https://wa.me/${d.length === 10 ? "91" + d : d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export async function getContent() {
  const site = await getSite();
  const content = { ...DEFAULT_CONTENT, ...((site?.site_content ?? {}) as Partial<SiteContent>) };
  return { content, site };
}
