import type { Metadata } from "next";
import SevaPage, { Ticks } from "@/components/SevaPage";
import { getContent } from "@/lib/content";

export const metadata: Metadata = { title: "Bulk ghee for derasars and dharmik anushthans" };

const USES = ["Pooja, aarti and diya", "Bhojanshala and prasad", "Pratishtha mahotsav, chaturmas, paryushan, varshitap", "Any dharmik anushthan or seva"];

export default async function Derasar() {
  const { content } = await getContent();
  return (
    <SevaPage phone={content.phone} waText="Jai Jinendra, I'd like bulk ghee rates for our derasar"
      title="Ghee for derasars, temples and sanghs"
      intro="Purity and consistency matter in every dharmik activity. For Jain derasars, temples, sanghs and bhojanshalas we offer special pricing on bulk ghee orders.">
      <section className="pt-14">
        <h2 className="text-2xl font-bold text-kadhai md:text-3xl">What we supply for</h2>
        <div className="mt-6"><Ticks items={USES} /></div>
      </section>
      <section className="pt-14">
        <h2 className="text-2xl font-bold text-kadhai md:text-3xl">What you can count on</h2>
        <div className="mt-6"><Ticks items={["Pure ghee of consistent quality", "Delivery on time, at your location", "Reliable supply for bulk requirements", "One point of contact for every order"]} /></div>
      </section>
      <section className="pt-14">
        <div className="rounded-3xl border-2 border-dashed border-ghee/60 p-8">
          <h2 className="text-2xl font-bold text-kadhai">Wholesale rates on request</h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink/80">Rates depend on the ghee, the quantity and how often you need it. Get in touch and we will offer the best price we can for your dharmik needs.</p>
        </div>
      </section>
    </SevaPage>
  );
}
