import type { Metadata } from "next";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { getContent, SOCIAL, waLink } from "@/lib/content";

export const metadata: Metadata = { title: "Contact" };

export default async function Contact() {
  const { content } = await getContent();
  const ways = [
    content.phone && { icon: <WhatsAppIcon size={24} />, label: "WhatsApp", value: content.phone, href: waLink(content.phone, "Hi Shatrunjay"), ext: true },
    content.phone && { icon: <PhoneIcon size={24} />, label: "Call", value: content.phone, href: `tel:+91${content.phone.replace(/\D/g, "").slice(-10)}` },
    content.email && { icon: <MailIcon size={24} />, label: "Email", value: content.email, href: `mailto:${content.email}` },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string; ext?: boolean }[];
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-extrabold text-kadhai md:text-5xl">Talk to us</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">For orders, bulk rates for derasars, or a question about your delivery.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {ways.map((w) => (
          <a key={w.label} href={w.href} {...(w.ext ? { target: "_blank", rel: "noreferrer" } : {})} className="group rounded-3xl border border-line bg-white p-6 transition-shadow hover:shadow-lg">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-label">{w.icon}</span>
            <p className="mt-5 text-sm text-muted">{w.label}</p>
            <p className="mt-0.5 break-all font-semibold text-kadhai group-hover:text-maroon">{w.value}</p>
          </a>
        ))}
      </div>
      {content.address && (
        <div className="mt-4 grid overflow-hidden rounded-3xl border border-line bg-white md:grid-cols-[1fr_1.4fr]">
          <div className="p-6 md:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-label"><PinIcon size={24} /></span>
            <p className="mt-5 text-sm text-muted">Visit us</p>
            <address className="mt-1 font-semibold not-italic leading-relaxed text-kadhai">{content.address}</address>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.address)}`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-maroon hover:underline">Open in Google Maps</a>
            <div className="mt-8 flex gap-4 text-sm font-medium">
              <a href={SOCIAL.instagram} target="_blank" rel="noreferrer" className="hover:text-maroon">Instagram</a>
              <a href={SOCIAL.facebook} target="_blank" rel="noreferrer" className="hover:text-maroon">Facebook</a>
              <a href={SOCIAL.youtube} target="_blank" rel="noreferrer" className="hover:text-maroon">YouTube</a>
            </div>
          </div>
          <iframe title="Map to our shop" loading="lazy" className="h-72 w-full border-0 md:h-full" referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(content.address)}&output=embed`} />
        </div>
      )}
    </div>
  );
}
