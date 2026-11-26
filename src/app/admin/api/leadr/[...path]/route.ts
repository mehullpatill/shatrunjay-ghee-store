import { crossSite, getAdmin, leadrApiUrl } from "@/lib/adminSession";

const ALLOWED = /^(orders|products|settings|reports|promo-codes|referrals)(\/|$)/;

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (crossSite(req)) return Response.json({ detail: "Forbidden" }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return Response.json({ detail: "Not signed in" }, { status: 401 });
  const path = (await params).path.join("/");
  if (!ALLOWED.test(path) || path.includes("..")) return Response.json({ detail: "Not found" }, { status: 404 });
  const url = `${leadrApiUrl(`/orgs/${encodeURIComponent(admin.org)}/commerce/${path}`)}${new URL(req.url).search}`;
  const response = await fetch(url, { method: req.method, cache: "no-store", headers: { Authorization: `Bearer ${admin.token}`, "Content-Type": "application/json" }, body: ["GET", "HEAD", "DELETE"].includes(req.method) ? undefined : await req.text() }).catch(() => null);
  if (!response) return Response.json({ detail: "Shop backend unreachable" }, { status: 502 });
  return new Response(response.status === 204 ? null : response.body, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", ...(response.headers.get("content-disposition") ? { "Content-Disposition": response.headers.get("content-disposition")! } : {}) } });
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
