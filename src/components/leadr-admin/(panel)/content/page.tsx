"use client";
import { useState } from "react";
import { api, refresh, useApi } from "@/lib/adminApi";
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/content";
import { ErrorLine, PageHeader, Skeleton, toast } from "../ui";

type F = [keyof Omit<SiteContent, "faq">, string, boolean];
const HOME: F[] = [
  ["announcement", "Strip at the very top of every page", false], ["hero_title", "Home page headline", false], ["hero_subtitle", "Line under the headline", true],
  ["about", "About the brand (home page and footer)", true],
];
const CONTACT: F[] = [["phone", "Phone", false], ["email", "Email", false], ["address", "Address", true], ["gstin", "GSTIN", false], ["fssai", "FSSAI licence no.", false]];

export default function Content() {
  const { data, error } = useApi<{ site_content: Partial<SiteContent> }>("settings");
  if (!data) return <div><PageHeader title="Website content" /><ErrorLine msg={error} /><div className="panel"><Skeleton /></div></div>;
  return <ContentForm initial={{ ...DEFAULT_CONTENT, ...data.site_content }} />;
}

function ContentForm({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const setFaq = (i: number, k: "q" | "a", v: string) => setC({ ...c, faq: c.faq.map((f, j) => (j === i ? { ...f, [k]: v } : f)) });
  const field = ([k, label, multi]: F) => (
    <label key={k} className="block"><span className="lbl">{label}</span>
      {multi ? <textarea className="field" rows={3} value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} />
        : <input className="field" value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} />}
    </label>
  );
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api("settings", { method: "PATCH", body: JSON.stringify({ site_content: c }) }); refresh("settings"); toast("Saved. The website shows it on the next page load."); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="max-w-3xl">
      <PageHeader title="Website content" sub="The words on the website. Products and prices are under Products.">
        <a className="btn-ghost" href="/" target="_blank">Open website</a>
        <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </PageHeader>
      <ErrorLine msg={err} />
      <div className="space-y-5 text-sm">
        <section className="panel space-y-4 p-5"><h2 className="text-base font-bold text-kadhai">Home page</h2>{HOME.map(field)}</section>
        <section className="panel space-y-4 p-5">
          <div><h2 className="text-base font-bold text-kadhai">Contact details</h2><p className="text-xs text-muted">Shown in the footer and on the Contact page.</p></div>
          {CONTACT.map(field)}
        </section>
        <section className="panel p-5">
          <h2 className="text-base font-bold text-kadhai">Questions customers ask</h2>
          <div className="mt-3 space-y-3">
            {c.faq.map((f, i) => (
              <div key={i} className="space-y-2 rounded-md border border-line p-3">
                <input className="field font-medium" placeholder="Question" aria-label={`Question ${i + 1}`} value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} />
                <textarea className="field" rows={2} placeholder="Answer" aria-label={`Answer ${i + 1}`} value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
                <button type="button" className="text-xs text-maroon hover:underline" onClick={() => setC({ ...c, faq: c.faq.filter((_, j) => j !== i) })}>Remove this question</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost mt-3" onClick={() => setC({ ...c, faq: [...c.faq, { q: "", a: "" }] })}>Add a question</button>
        </section>
      </div>
    </form>
  );
}

