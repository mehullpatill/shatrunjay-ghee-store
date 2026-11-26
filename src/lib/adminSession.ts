import { cookies } from "next/headers";
import { getEnv, requireEnvValue } from "./env";

export const LEADR = getEnv().LEADR_API_URL || "http://localhost:8000/api/v1";
const OPTS = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

// The org always comes from the server's SHOP_ORG_ID, never from a cookie the browser could edit.
export async function getAdmin() {
  const token = (await cookies()).get("sg_admin")?.value, org = process.env.SHOP_ORG_ID;
  return token && org ? { token, org } : null;
}

export function isLeadrAdminEnabled() {
  return getEnv().COMMERCE_BACKEND === "leadr";
}

export function leadrApiUrl(path: string) {
  return `${requireEnvValue(getEnv().LEADR_API_URL, "LEADR_API_URL")}${path}`;
}
export async function setAdmin(token: string) {
  (await cookies()).set("sg_admin", token, { ...OPTS, maxAge: 60 * 60 * 8 });
}
export async function clearAdmin() {
  const c = await cookies();
  c.delete("sg_admin"); c.delete("sg_org");
}

// SameSite=Lax still sends the cookie from any *.rahtsaaai.com site, so writes must come from this site's own pages.
export function crossSite(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return false;
  const origin = req.headers.get("origin"), host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !origin || new URL(origin).host !== host;
  } catch {
    return true;
  }
}

