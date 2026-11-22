import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";
import { assertSameOrigin, getClientIp, hashPassword, hashToken } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`reset:${ip}`, 10, 900);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.type !== "PASSWORD_RESET" || record.usedAt || record.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash, failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.json({ message: "Password updated successfully. Please log in." });
}
