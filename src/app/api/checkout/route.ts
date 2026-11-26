import { assertSameOrigin } from "@/lib/security";
import { leadr } from "@/lib/leadr";
import { getEnv } from "@/lib/env";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return Response.json({ detail: "Invalid origin" }, { status: 403 });
  if (getEnv().COMMERCE_BACKEND !== "leadr") return Response.json({ detail: "Leadr commerce is not enabled" }, { status: 409 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ detail: "Bad request" }, { status: 400 });
  const response = await leadr("/storefront/orders", { method: "POST", body: JSON.stringify(body) }).catch(() => null);
  if (!response) return Response.json({ detail: "Shop is temporarily unavailable, please try again." }, { status: 502 });
  return new Response(await response.text(), { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } });
}
