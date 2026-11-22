import { getSessionUser, clearSessionCookie } from "@/lib/auth";

export const LEADR = "";

export async function getAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return { token: user.id, org: "shatrunjay", user };
}

export async function clearAdmin() {
  await clearSessionCookie();
}

export function crossSite(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return false;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !origin || new URL(origin).host !== host;
  } catch {
    return true;
  }
}
