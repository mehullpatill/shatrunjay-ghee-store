import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { AuthError, generateTotpSetup, requireRole, verifyTotpCode } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp } from "@/lib/security";

export async function GET() {
  try {
    const admin = await requireRole("ADMIN");
    const { secret, otpauthUrl } = generateTotpSetup(admin.email);
    await prisma.user.update({ where: { id: admin.id }, data: { totpSecret: secret } });
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return NextResponse.json({ secret, qrDataUrl });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const admin = await requireRole("ADMIN");
    const body = (await req.json()) as { code?: string; enable?: boolean };
    const user = await prisma.user.findUnique({ where: { id: admin.id } });
    if (!user?.totpSecret) {
      return NextResponse.json({ error: "2FA setup not initialized" }, { status: 400 });
    }
    if (body.enable === false) {
      await prisma.user.update({ where: { id: admin.id }, data: { totpEnabled: false, totpSecret: null } });
      await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "DISABLE_2FA", entityType: "User", entityId: admin.id, ip: getClientIp(req) });
      return NextResponse.json({ enabled: false });
    }
    if (!body.code || !verifyTotpCode(user.totpSecret, body.code)) {
      return NextResponse.json({ error: "Invalid TOTP code" }, { status: 400 });
    }
    await prisma.user.update({ where: { id: admin.id }, data: { totpEnabled: true } });
    await recordAuditLog({ actorId: admin.id, actorEmail: admin.email, action: "ENABLE_2FA", entityType: "User", entityId: admin.id, ip: getClientIp(req) });
    return NextResponse.json({ enabled: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to verify 2FA" }, { status: 400 });
  }
}
