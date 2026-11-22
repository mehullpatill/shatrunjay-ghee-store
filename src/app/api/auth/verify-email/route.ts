import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`verify-email:${ip}`, 20, 900);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.token || body.token.length < 10) {
    return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
  }

  const tokenHash = hashToken(body.token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.type !== "EMAIL_VERIFY" || record.usedAt || record.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Email verified successfully. You can now place orders." });
}
