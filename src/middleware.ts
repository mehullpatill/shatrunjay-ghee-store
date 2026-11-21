import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "shatrunjay_session";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verifyEdgeToken(token: string | undefined): Promise<{ role?: string; exp?: number } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;

  const secret = process.env.AUTH_SECRET || "dev-fallback-secret-change-in-env";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  const expectedSig = toBase64Url(new Uint8Array(signatureBuffer));

  if (sig !== expectedSig) return null;

  try {
    const jsonStr = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(jsonStr) as { role?: string; exp?: number };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const payload = await verifyEdgeToken(token);

    if (!payload || payload.role !== "ADMIN") {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
