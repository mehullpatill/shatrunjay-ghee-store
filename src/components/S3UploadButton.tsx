"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";

export function S3UploadButton({
  folder,
  accept = "image/*,video/*,application/pdf",
  label = "Upload to S3",
  onUploaded,
}: {
  folder: string;
  accept?: string;
  label?: string;
  onUploaded: (publicUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || "Presign failed");

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("S3 upload failed");

      onUploaded(presignData.publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-espresso/20 bg-cream-soft px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-cream-warm">
        <Upload className="h-3.5 w-3.5 text-ghee-dark" />
        {uploading ? "Uploading..." : label}
        <input type="file" accept={accept} onChange={handleFile} className="hidden" disabled={uploading} />
      </label>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
