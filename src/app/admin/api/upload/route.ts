import { crossSite, getAdmin } from "@/lib/adminSession";
import { createPresignedUploadUrl } from "@/lib/s3";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (crossSite(req)) return Response.json({ detail: "Forbidden" }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return Response.json({ detail: "Not signed in" }, { status: 401 });

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return Response.json({ detail: "No file" }, { status: 400 });
  if (!TYPES.includes(file.type)) return Response.json({ detail: "Use a JPG, PNG or WebP image" }, { status: 400 });
  if (file.size > MAX) return Response.json({ detail: "Image must be under 5 MB" }, { status: 400 });

  try {
    const { uploadUrl, publicUrl } = await createPresignedUploadUrl({
      folder: "products",
      filename: file.name,
      contentType: file.type,
    });
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!put.ok) return Response.json({ detail: "S3 upload failed" }, { status: 502 });
    return Response.json({ url: publicUrl });
  } catch (err) {
    return Response.json(
      { detail: err instanceof Error ? err.message : "S3 storage is not configured on this server" },
      { status: 503 }
    );
  }
}
