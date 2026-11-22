import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { assertSameOrigin, getClientIp, verifyPassword } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { attachSessionCookie, createSession, verifyTotpCode } from "@/lib/auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`login:${ip}`, 20, 900);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Please wait 15 minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const { email, password, totpCode } = parsed.data;
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const emailConfigured = Boolean(
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.SES_FROM_EMAIL
  );
  if (!emailConfigured && !user.emailVerifiedAt) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: "Account temporarily locked due to repeated failed attempts. Try again later." },
      { status: 423 }
    );
  }

  const passwordOk = await verifyPassword(user.passwordHash, password);
  if (!passwordOk) {
    const nextFailed = user.failedLoginAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: nextFailed,
        lockedUntil:
          nextFailed >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : null,
      },
    });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.totpEnabled && user.totpSecret) {
    if (!totpCode) {
      return NextResponse.json({ error: "2FA code required", requiresTotp: true }, { status: 401 });
    }
    if (!verifyTotpCode(user.totpSecret, totpCode)) {
      return NextResponse.json({ error: "Invalid 2FA code", requiresTotp: true }, { status: 401 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const { rawToken, expiresAt } = await createSession(user.id, {
    userAgent: req.headers.get("user-agent"),
    ip,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
      referralCode: user.referralCode,
    },
  });
  attachSessionCookie(res, rawToken, expiresAt);
  return res;
}
