import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, generateOpaqueToken, getClientIp, hashToken } from "@/lib/security";
import { emailService } from "@/lib/ses";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ message: "Email is already verified." });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`resend-verify:${user.id}:${ip}`, 3, 900);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Please wait before requesting another verification email." }, { status: 429 });
  }

  const rawToken = generateOpaqueToken(32);
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      type: "EMAIL_VERIFY",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const verifyUrl = `${siteUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
  await emailService.sendVerificationEmail(user.email, user.name, verifyUrl);

  return NextResponse.json({ message: "Verification email sent." });
}
