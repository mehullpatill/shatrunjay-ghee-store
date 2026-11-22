"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPincodesClient({
  pincodes,
}: {
  pincodes: Array<{ id: string; pincode: string; isMumbai: boolean; isCodAllowed: boolean; area: string | null }>;
}) {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [isMumbai, setIsMumbai] = useState(true);
  const [isCodAllowed, setIsCodAllowed] = useState(true);
  const [area, setArea] = useState("");
  const [csvText, setCsvText] = useState("");
  const [msg, setMsg] = useState("");

  const addSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/pincodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert", pincode, isMumbai, isCodAllowed, area }),
    });
    const d = (await res.json()) as { error?: string };
    setMsg(res.ok ? `Saved pincode ${pincode}` : d.error || "Failed");
    setPincode("");
    setArea("");
    router.refresh();
  };

  const uploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/pincodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk_csv", csvText }),
    });
    const d = (await res.json()) as { imported?: number; error?: string };
    setMsg(res.ok ? `Imported ${d.imported} pincodes.` : d.error || "CSV import failed");
    setCsvText("");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-kadhai">Pincodes (Mumbai &amp; COD)</h1>
      {msg && <p className="rounded-lg bg-butter px-4 py-2 text-sm font-medium text-kadhai">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={addSingle} className="panel p-5 space-y-3">
          <h2 className="text-lg font-bold text-kadhai">Add / Update Single Pincode</h2>
          <input type="text" required maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} placeholder="6-digit pincode (e.g. 400004)" className="field" />
          <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area (optional)" className="field" />
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={isMumbai} onChange={(e) => setIsMumbai(e.target.checked)} /> Mumbai (2–3 days)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={isCodAllowed} onChange={(e) => setIsCodAllowed(e.target.checked)} /> COD Allowed</label>
          </div>
          <button type="submit" className="btn">Save Pincode</button>
        </form>

        <form onSubmit={uploadCsv} className="panel p-5 space-y-3">
          <h2 className="text-lg font-bold text-kadhai">Bulk CSV Upload</h2>
          <p className="text-xs text-muted">Format per line: <code>pincode,isMumbai,isCodAllowed,city,area</code> (e.g. <code>400004,true,true,Mumbai,Girgaon</code>)</p>
          <textarea rows={4} required value={csvText} onChange={(e) => setCsvText(e.target.value)} className="field font-mono text-xs" placeholder="400001,true,true,Mumbai,Fort" />
          <button type="submit" className="btn">Import CSV</button>
        </form>
      </div>

      <div className="panel overflow-x-auto p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-1.5">Pincode</th>
              <th className="py-1.5">Area</th>
              <th className="py-1.5">Mumbai</th>
              <th className="py-1.5">COD</th>
              <th className="py-1.5 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pincodes.map((p) => (
              <tr key={p.id}>
                <td className="py-2 font-mono font-bold">{p.pincode}</td>
                <td className="py-2">{p.area || "—"}</td>
                <td className="py-2">{p.isMumbai ? "Yes" : "No"}</td>
                <td className="py-2">{p.isCodAllowed ? "Allowed" : "Online Only"}</td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/admin/pincodes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "delete", pincode: p.pincode }),
                      });
                      router.refresh();
                    }}
                    className="text-xs text-maroon hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
