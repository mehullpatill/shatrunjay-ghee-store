import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (user) {
      return NextResponse.json({ skipped: true, email: true });
    }

    const body = await req.json().catch(() => null);
    const email = body?.email?.trim()?.toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ detail: "Please enter a valid email address for the verification code." }, { status: 400 });
    }

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: { email, code, expiresAt },
    });

    await sendEmail({
      to: email,
      subject: `Your Shatrunjay Ghee Verification Code: ${code}`,
      html: `<p>Your 6-digit checkout verification code is <strong>${code}</strong>. Valid for 10 minutes.</p>`,
    });

    return NextResponse.json({ email: true, whatsapp: false });
  } catch (err) {
    console.error("OTP error:", err);
    return NextResponse.json({ detail: "Failed to send verification code." }, { status: 500 });
  }
}
