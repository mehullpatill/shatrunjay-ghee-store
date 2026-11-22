import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";
import {
  assertSameOrigin,
  generateOpaqueToken,
  generateReferralCode,
  getClientIp,
  hashPassword,
  hashToken,
  verifyTurnstile,
} from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { emailService } from "@/lib/ses";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`signup:${ip}`, 10, 900);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { name, email, phone, password, referralCodeUsed, turnstileToken, website } = parsed.data;
  if (website) {
    return NextResponse.json({ message: "If your email is new, a verification link has been sent." });
  }

  // CAPTCHA is optional until Turnstile is configured in the deployment.
  // Once a secret key is present, enforce server-side verification.
  if (process.env.TURNSTILE_SECRET_KEY) {
    const captchaOk = await verifyTurnstile(turnstileToken, ip);
    if (!captchaOk) {
      return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Generic message to prevent email enumeration
    return NextResponse.json({
      message: "If this email is eligible, a verification link has been sent to your inbox.",
    });
  }

  let referredById: string | null = null;
  if (referralCodeUsed) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: referralCodeUsed.toUpperCase() } });
    if (referrer) referredById = referrer.id;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone: phone || null,
      passwordHash,
      role: "CUSTOMER",
      referralCode: generateReferralCode(name),
      referredById,
    },
  });

  const emailConfigured = Boolean(
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.SES_FROM_EMAIL
  );

  if (emailConfigured) {
    const rawToken = generateOpaqueToken(32);
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        type: "EMAIL_VERIFY",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shatrunjay-ghee-store.vercel.app";
    const verifyUrl = `${siteUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    await emailService.sendVerificationEmail(user.email, user.name, verifyUrl);
  } else {
    // No email provider is configured: activate the account without email verification.
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  return NextResponse.json(
    {
      message: emailConfigured
        ? "Account created! Please check your email to verify your address."
        : "Account created successfully! You can now log in and place orders.",
    },
    { status: 201 }
  );
}
