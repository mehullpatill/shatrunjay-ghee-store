"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProcessStepDraft {
  heading: string;
  subheading: string;
  imageUrl: string;
  imageS3Key: string;
}

interface ProcessDraft {
  title: string;
  subtitle: string;
  videoUrl: string;
  steps: ProcessStepDraft[];
}

export default function AdminCmsClient({
  sections,
  processBlocks,
  licenses,
  archives,
  reels,
}: {
  sections: Array<{ id: string; pageKey: string; sectionKey: string; heading: string; subheading: string | null; content: string | null }>;
  processBlocks: Array<{ id: string; key: string; title: string; subtitle: string | null; videoUrl: string | null; steps: Array<{ id: string; stepOrder: number; heading: string; subheading: string | null; imageUrl: string | null; imageS3Key: string | null }> }>;
  licenses: Array<{ id: string; name: string; number: string }>;
  archives: Array<{ id: string; sectionKey: string; name: string; location: string | null; imageUrl: string }>;
  reels: Array<{ id: string; title: string | null; thumbnailUrl: string; reelUrl: string }>;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [processDrafts, setProcessDrafts] = useState<Record<string, ProcessDraft>>(() => Object.fromEntries(processBlocks.map((pb) => [
    pb.key,
    {
      title: pb.title,
      subtitle: pb.subtitle || "",
      videoUrl: pb.videoUrl || "",
      steps: pb.steps.map((step) => ({ heading: step.heading, subheading: step.subheading || "", imageUrl: step.imageUrl || "", imageS3Key: step.imageS3Key || "" })),
    },
  ])));
  const [processImageFiles, setProcessImageFiles] = useState<Record<string, File | null>>({});
  const [savingProcessKey, setSavingProcessKey] = useState<string | null>(null);

  // Section editor
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || "");
  const activeSec = sections.find((s) => s.id === selectedSectionId) || sections[0];
  const [secHeading, setSecHeading] = useState(activeSec?.heading || "");
  const [secSub, setSecSub] = useState(activeSec?.subheading || "");
  const [secContent, setSecContent] = useState(activeSec?.content || "");

  // License add
  const [licName, setLicName] = useState("");
  const [licNumber, setLicNumber] = useState("");

  // Archive add
  const [archSection, setArchSection] = useState("derasar:jinalay");
  const [archName, setArchName] = useState("");
  const [archLoc, setArchLoc] = useState("");
  const [archImg, setArchImg] = useState("/brand/photos/pack-cow.jpg");

  // Reel add
  const [reelTitle, setReelTitle] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [reelThumb, setReelThumb] = useState("/brand/photos/paratha.jpg");

  const postCms = async (payload: Record<string, unknown>) => {
    setMsg("");
    const res = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = (await res.json()) as { error?: string };
    setMsg(res.ok ? "CMS updated." : d.error || "Failed");
    router.refresh();
  };

  const uploadProcessImage = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "process", kind: "image", mime: file.type || "image/jpeg", ext, sizeBytes: file.size }),
    });
    const presign = (await presignRes.json()) as { uploadUrl?: string; publicUrl?: string; s3Key?: string; error?: string };
    if (!presignRes.ok || !presign.uploadUrl || !presign.publicUrl) throw new Error(presign.error || "Could not prepare process image upload");
    const putRes = await fetch(presign.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });
    if (!putRes.ok) throw new Error(`Image upload failed for ${file.name}`);
    return { imageUrl: presign.publicUrl, imageS3Key: presign.s3Key || "" };
  };

  const saveProcess = async (key: string) => {
    const draft = processDrafts[key];
    if (!draft) return;
    setSavingProcessKey(key);
    setMsg("");
    try {
      const steps = [...draft.steps];
      for (let index = 0; index < steps.length; index += 1) {
        const file = processImageFiles[`${key}:${index}`];
        const existingStep = steps[index];
        if (file && existingStep) steps[index] = { ...existingStep, ...(await uploadProcessImage(file)) };
      }
      await postCms({ action: "upsert_process_block", key, title: draft.title, subtitle: draft.subtitle, videoUrl: draft.videoUrl, steps });
      setProcessDrafts((prev) => ({ ...prev, [key]: { ...draft, steps } }));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save process block");
    } finally {
      setSavingProcessKey(null);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-kadhai">CMS &amp; Pages</h1>
      {msg && <p className="rounded-lg bg-butter px-4 py-2 text-sm font-medium text-kadhai">{msg}</p>}

      {/* Site Sections Editor (includes Legal Pages, Derasar, Wholesale, Why Shatrunjay, etc.) */}
      <div className="panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-kadhai">Page Sections &amp; Legal Pages</h2>
        <select
          value={selectedSectionId}
          onChange={(e) => {
            const next = sections.find((s) => s.id === e.target.value);
            setSelectedSectionId(e.target.value);
            if (next) {
              setSecHeading(next.heading);
              setSecSub(next.subheading || "");
              setSecContent(next.content || "");
            }
          }}
          className="field"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.pageKey} / {s.sectionKey}</option>
          ))}
        </select>
        {activeSec && (
          <div className="space-y-3">
            <input type="text" value={secHeading} onChange={(e) => setSecHeading(e.target.value)} placeholder="Heading" className="field" />
            <input type="text" value={secSub} onChange={(e) => setSecSub(e.target.value)} placeholder="Subheading" className="field" />
            <textarea rows={5} value={secContent} onChange={(e) => setSecContent(e.target.value)} placeholder="HTML / Text Content" className="field font-mono text-xs" />
            <button
              type="button"
              onClick={() =>
                postCms({
                  action: "upsert_section",
                  pageKey: activeSec.pageKey,
                  sectionKey: activeSec.sectionKey,
                  heading: secHeading,
                  subheading: secSub,
                  content: secContent,
                })
              }
              className="btn"
            >
              Save Section
            </button>
          </div>
        )}
      </div>

      {/* Process Blocks (Max 9 Steps) */}
      <div className="panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-kadhai">Making Process Blocks &amp; Photos (Max 9 Steps)</h2>
        {processBlocks.map((pb) => (
          <div key={pb.id} className="rounded-xl border border-line p-4 text-sm space-y-3">
            {(() => {
              const draft = processDrafts[pb.key];
              if (!draft) return null;
              return (
                <>
                  <p className="font-bold text-kadhai">{pb.key}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={draft.title} onChange={(e) => setProcessDrafts((prev) => ({ ...prev, [pb.key]: { ...draft, title: e.target.value } }))} placeholder="Process title" className="field" />
                    <input value={draft.videoUrl} onChange={(e) => setProcessDrafts((prev) => ({ ...prev, [pb.key]: { ...draft, videoUrl: e.target.value } }))} placeholder="Optional process video URL" className="field" />
                  </div>
                  <textarea rows={2} value={draft.subtitle} onChange={(e) => setProcessDrafts((prev) => ({ ...prev, [pb.key]: { ...draft, subtitle: e.target.value } }))} placeholder="Process subtitle" className="field" />
                  <div className="space-y-3">
                    {draft.steps.map((step, index) => (
                      <div key={`${pb.key}-${index}`} className="rounded-lg border border-line bg-butter p-3">
                        <p className="mb-2 text-xs font-bold text-kadhai">Step {index + 1}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input value={step.heading} onChange={(e) => setProcessDrafts((prev) => ({ ...prev, [pb.key]: { ...draft, steps: draft.steps.map((item, i) => i === index ? { ...item, heading: e.target.value } : item) } }))} placeholder="Step heading" className="field" />
                          <input value={step.subheading} onChange={(e) => setProcessDrafts((prev) => ({ ...prev, [pb.key]: { ...draft, steps: draft.steps.map((item, i) => i === index ? { ...item, subheading: e.target.value } : item) } }))} placeholder="Step description" className="field" />
                          <input value={step.imageUrl} onChange={(e) => setProcessDrafts((prev) => ({ ...prev, [pb.key]: { ...draft, steps: draft.steps.map((item, i) => i === index ? { ...item, imageUrl: e.target.value } : item) } }))} placeholder="Photo URL (optional)" className="field" />
                          <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setProcessImageFiles((prev) => ({ ...prev, [`${pb.key}:${index}`]: e.target.files?.[0] || null }))} className="field" />
                        </div>
                        {(step.imageUrl || processImageFiles[`${pb.key}:${index}`]) && <p className="mt-2 text-xs text-muted">{processImageFiles[`${pb.key}:${index}`]?.name || step.imageUrl}</p>}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => saveProcess(pb.key)} disabled={savingProcessKey === pb.key} className="btn text-xs">
                    {savingProcessKey === pb.key ? "Uploading & saving..." : "Save process and photos"}
                  </button>
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Licenses */}
      <div className="panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-kadhai">Licenses (Our Story &amp; Footer)</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input type="text" value={licName} onChange={(e) => setLicName(e.target.value)} placeholder="License Name (e.g. FSSAI)" className="field" />
          <input type="text" value={licNumber} onChange={(e) => setLicNumber(e.target.value)} placeholder="License Number" className="field" />
          <button
            type="button"
            onClick={() => {
              if (!licName || !licNumber) return;
              postCms({ action: "upsert_license", name: licName, number: licNumber, sortOrder: licenses.length + 1, active: true });
              setLicName("");
              setLicNumber("");
            }}
            className="btn"
          >
            Add License
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {licenses.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <span><strong>{l.name}:</strong> {l.number}</span>
              <button type="button" onClick={() => postCms({ action: "delete_license", id: l.id })} className="text-xs text-maroon hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Archives (Derasar / Ghee Laabh Yojna / Wholesale) */}
      <div className="panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-kadhai">Archives (Derasar / Ghee Laabh Yojna / Wholesale)</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <select value={archSection} onChange={(e) => setArchSection(e.target.value)} className="field">
            <option value="derasar:jinalay">Derasar: Jinalay</option>
            <option value="derasar:bhojanshala">Derasar: Bhojanshala</option>
            <option value="derasar:pratishtha_mahostav">Derasar: Pratishtha Mahostav</option>
            <option value="derasar:chaturmas">Derasar: Chaturmas</option>
            <option value="derasar:varshitap">Derasar: Varshitap</option>
            <option value="derasar:navanu_yatra">Derasar: Navanu Yatra</option>
            <option value="derasar:other_religious_functions">Derasar: Other Religious Functions</option>
            <option value="ghee_laabh_yojna">Ghee Laabh Yojna</option>
            <option value="wholesale:temples">Wholesale: Temples</option>
            <option value="wholesale:social_events">Wholesale: Social Events</option>
            <option value="wholesale:restaurants_clubs">Wholesale: Restaurants &amp; Clubs</option>
            <option value="wholesale:reseller">Wholesale: Reseller</option>
          </select>
          <input type="text" value={archName} onChange={(e) => setArchName(e.target.value)} placeholder="Name" className="field" />
          <input type="text" value={archLoc} onChange={(e) => setArchLoc(e.target.value)} placeholder="Location" className="field" />
          <input type="text" value={archImg} onChange={(e) => setArchImg(e.target.value)} placeholder="Image URL" className="field" />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!archName) return;
            postCms({ action: "upsert_archive", sectionKey: archSection, name: archName, location: archLoc, imageUrl: archImg, sortOrder: archives.length + 1, active: true });
            setArchName("");
            setArchLoc("");
          }}
          className="btn"
        >
          Add Archive Entry
        </button>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          {archives.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-line p-2.5">
              <span><strong>{a.name}</strong> ({a.sectionKey}) — {a.location}</span>
              <button type="button" onClick={() => postCms({ action: "delete_archive", id: a.id })} className="text-maroon hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Instagram Reels */}
      <div className="panel p-6 space-y-4">
        <h2 className="text-lg font-bold text-kadhai">Instagram Reels ({reels.length})</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input type="text" value={reelTitle} onChange={(e) => setReelTitle(e.target.value)} placeholder="Title (optional)" className="field" />
          <input type="url" value={reelUrl} onChange={(e) => setReelUrl(e.target.value)} placeholder="Instagram Reel URL" className="field" />
          <input type="text" value={reelThumb} onChange={(e) => setReelThumb(e.target.value)} placeholder="Thumbnail URL" className="field" />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!reelUrl) return;
            postCms({ action: "upsert_reel", title: reelTitle, reelUrl, thumbnailUrl: reelThumb, sortOrder: reels.length + 1, active: true });
            setReelTitle("");
            setReelUrl("");
          }}
          className="btn"
        >
          Add Reel
        </button>
      </div>
    </div>
  );
}
