"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLabReportsClient({
  reports,
}: {
  reports: Array<{ id: string; batchNo: string; reportDate: string; labName: string; fileUrl: string }>;
}) {
  const router = useRouter();
  const [batchNo, setBatchNo] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [labName, setLabName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: "lab-reports",
          kind: "lab_report",
          mime: file.type || "application/pdf",
          ext,
          sizeBytes: file.size,
        }),
      });
      const presign = (await presignRes.json()) as { uploadUrl?: string; s3Key?: string; publicUrl?: string; error?: string };
      if (!presignRes.ok || !presign.uploadUrl) {
        setMsg(presign.error || "Presign failed");
        setUploading(false);
        return;
      }

      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });
      if (!putRes.ok) {
        setMsg("S3 upload failed");
        setUploading(false);
        return;
      }

      const saveRes = await fetch("/api/admin/lab-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchNo,
          reportDate,
          labName,
          fileUrl: presign.publicUrl,
          s3Key: presign.s3Key,
          fileMime: file.type || "application/pdf",
        }),
      });
      const saveData = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        setMsg(saveData.error || "Could not save report");
      } else {
        setMsg("Lab report uploaded.");
        setBatchNo("");
        setLabName("");
        setFile(null);
        router.refresh();
      }
    } catch {
      setMsg("Upload error.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-kadhai">Lab Reports</h1>
      {msg && <p className="rounded-lg bg-butter px-4 py-2 text-sm font-medium text-kadhai">{msg}</p>}

      <form onSubmit={handleUpload} className="panel p-5 space-y-3">
        <h2 className="text-lg font-bold text-kadhai">Upload New Lab Report (PDF or Image)</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <input type="text" required value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="Batch No" className="field" />
          <input type="date" required value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="field" />
          <input type="text" required value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Laboratory Name" className="field" />
          <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="field" />
        </div>
        <button type="submit" disabled={uploading} className="btn">
          {uploading ? "Uploading to S3..." : "Upload Lab Report"}
        </button>
      </form>

      <div className="panel p-5 space-y-2 text-sm">
        {reports.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-line p-3">
            <div>
              <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-maroon hover:underline">
                Batch {r.batchNo} — {r.labName}
              </a>
              <p className="text-xs text-muted">{new Date(r.reportDate).toLocaleDateString("en-IN")}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await fetch(`/api/admin/lab-reports?id=${r.id}`, { method: "DELETE" });
                router.refresh();
              }}
              className="text-xs text-maroon hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
