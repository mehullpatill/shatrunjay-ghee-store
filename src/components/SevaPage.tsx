import { PhoneIcon, WhatsAppIcon } from "./icons";
import { waLink } from "@/lib/content";

export default function SevaPage({ title, intro, phone, waText, children }: { title: string; intro: string; phone: string; waText: string; children: React.ReactNode }) {
  const tel = `tel:+91${phone.replace(/\D/g, "").slice(-10)}`;
  const cta = phone && (
    <div className="flex flex-wrap gap-3">
      <a href={waLink(phone, waText)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1fa855] px-6 py-3 font-semibold text-white hover:bg-[#178f47]"><WhatsAppIcon />WhatsApp {phone}</a>
      <a href={tel} className="inline-flex items-center gap-2 rounded-full border border-current px-6 py-3 font-semibold"><PhoneIcon />Call us</a>
    </div>
  );
  return (
    <>
      <section className="bg-label text-white">
        <div className="mx-auto grid max-w-7xl items-end gap-10 px-4 pt-12 md:px-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="pb-12 lg:pb-16">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">{title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">{intro}</p>
            <div className="mt-8 text-white">{cta}</div>
          </div>
          <div className="arch mx-auto hidden w-full max-w-sm bg-butter px-8 pt-10 lg:block"><img src="/brand/photos/pack-cow.jpg" alt="" className="pack w-full" /></div>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 md:px-6">{children}</div>
      {phone && (
        <section className="mx-auto mt-16 max-w-5xl px-4 md:px-6">
          <div className="rounded-3xl bg-butter p-8 md:p-10">
            <h2 className="text-2xl font-bold text-kadhai md:text-3xl">Talk to us about your requirement</h2>
            <p className="mt-2 max-w-xl text-muted">Tell us the occasion, the quantity and where it should reach.</p>
            <div className="mt-6 text-kadhai">{cta}</div>
          </div>
        </section>
      )}
    </>
  );
}

export function Ticks({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((t) => (
        <li key={t} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-label"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
