import type { Metadata } from "next";
import SevaPage, { Ticks } from "@/components/SevaPage";
import { getContent } from "@/lib/content";

export const metadata: Metadata = { title: "Ghee Laabh Yojna" };

const STEPS: [string, string][] = [
  ["Tell us the occasion", "Share the occasion, the quantity, and the derasar or temple you want the ghee to reach."],
  ["We deliver the ghee", "We coordinate with the derasar and deliver pure cow or buffalo ghee directly."],
  ["A receipt is arranged", "The derasar confirms the laabh and a receipt is arranged in your name."],
  ["You get proof of delivery", "We keep you updated and send proof once the ghee has reached."],
];

export default async function GheeLaabh() {
  const { content } = await getContent();
  return (
    <SevaPage phone={content.phone} waText="Jai Jinendra, I'd like to take ghee laabh"
      title="Turn your special moments into seva"
      intro="Celebrate a birthday, an anniversary, Paryushan, Chaturmas or Varshitap by taking ghee laabh: send pure cow or buffalo ghee to a derasar or sangh of your choice.">
      <section className="pt-14">
        <h2 className="text-2xl font-bold text-kadhai md:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-label font-display text-lg font-bold text-white">{i + 1}</span>
              <p className="mt-4 font-semibold text-kadhai">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="pt-14">
        <h2 className="text-2xl font-bold text-kadhai md:text-3xl">Why families choose us</h2>
        <div className="mt-6"><Ticks items={["Trusted by many derasars and sanghs", "Pure ghee of consistent quality", "Delivered on time, to the door", "Full coordination and transparency", "Bulk quantities at special rates"]} /></div>
        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-ink/80">With Ghee Laabh Yojna your bhavna reaches the right place with purity and care, and your seva is carried out smoothly and respectfully.</p>
      </section>
    </SevaPage>
  );
}
