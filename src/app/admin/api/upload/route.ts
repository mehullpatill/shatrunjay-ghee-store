import { crossSite, getAdmin, leadrApiUrl } from "@/lib/adminSession";

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
  const q = new URLSearchParams({ filename: file.name, content_type: file.type });
  const presign = await fetch(`${leadrApiUrl(`/orgs/${encodeURIComponent(admin.org)}/media/upload-url`)}?${q}`, { method: "POST", headers: { Authorization: `Bearer ${admin.token}` }, cache: "no-store" }).catch(() => null);
  if (!presign) return Response.json({ detail: "Shop backend unreachable" }, { status: 502 });
  if (!presign.ok) return Response.json({ detail: (await presign.json().catch(() => ({}))).detail ?? "Upload not allowed" }, { status: presign.status });
  const { upload_url, file_url, mock } = await presign.json();
  if (mock) return Response.json({ detail: "Image storage is not configured on this server" }, { status: 503 });
  const put = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: Buffer.from(await file.arrayBuffer()) });
  if (!put.ok) return Response.json({ detail: "Upload failed" }, { status: 502 });
  return Response.json({ url: file_url });
}
