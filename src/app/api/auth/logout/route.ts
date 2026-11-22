import { NextResponse } from "next/server";
import { clearSessionCookie, invalidateCurrentSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  await invalidateCurrentSession();
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
