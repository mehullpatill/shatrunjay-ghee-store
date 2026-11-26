import { clearAdmin, crossSite, LEADR, setAdmin } from "@/lib/adminSession";
import { getEnv } from "@/lib/env";

export async function POST(req: Request) {
  if (crossSite(req)) return Response.json({ error: "denied" }, { status: 403 });
  const { token, dev } = await req.json().catch(() => ({ token: "" }));
  const env = getEnv();
  if (!env.SHOP_ORG_ID) return Response.json({ error: "not_configured" }, { status: 500 });
  if (dev && process.env.NODE_ENV === "development" && env.DEV_ADMIN_TOKEN) { await setAdmin(env.DEV_ADMIN_TOKEN); return Response.json({ ok: true }); }
  const sso = await fetch(`${LEADR}/auth/sso`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => null);
  if (!sso) return Response.json({ error: "unavailable" }, { status: 502 });
  const body = await sso.json().catch(() => ({}));
  if (!sso.ok || body.status !== "ok") return Response.json({ error: body.status || "denied" }, { status: 401 });
  const me = await fetch(`${LEADR}/auth/me`, { headers: { Authorization: `Bearer ${body.access_token}` } });
  const orgs: { id: string }[] = me.ok ? ((await me.json()).organizations ?? []) : [];
  if (!orgs.some((org) => org.id === env.SHOP_ORG_ID)) return Response.json({ error: "no_access" }, { status: 403 });
  await setAdmin(body.access_token);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (crossSite(req)) return Response.json({ error: "denied" }, { status: 403 });
  await clearAdmin();
  return Response.json({ ok: true });
}
