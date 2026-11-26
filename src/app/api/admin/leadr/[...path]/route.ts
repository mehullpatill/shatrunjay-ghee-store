import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { leadr } from "@/lib/leadr";
import { assertSameOrigin } from "@/lib/security";

const ALLOWED_PATH = /^(orders|products|settings|reports|promo-codes|referrals)(\/|$)/;

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    await requireRole("ADMIN");
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const env = getEnv();
  if (env.COMMERCE_BACKEND !== "leadr") return NextResponse.json({ error: "Leadr commerce is not enabled" }, { status: 409 });
  if (!env.SHOP_ORG_ID) return NextResponse.json({ error: "SHOP_ORG_ID is not configured" }, { status: 503 });

  const path = (await params).path.join("/");
  if (!ALLOWED_PATH.test(path) || path.includes("..")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const response = await leadr(`/orgs/${encodeURIComponent(env.SHOP_ORG_ID)}/commerce/${path}${new URL(req.url).search}`, {
    method: req.method,
    body: ["GET", "HEAD", "DELETE"].includes(req.method) ? undefined : await req.text(),
  }).catch(() => null);
  if (!response) return NextResponse.json({ error: "Leadr is temporarily unavailable" }, { status: 502 });
  return new Response(response.status === 204 ? null : response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
