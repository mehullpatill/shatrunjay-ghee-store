import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactFormSchema } from "@/lib/validators";
import { assertSameOrigin, getClientIp, hashIp } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { emailService } from "@/lib/ses";

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`contact:${ip}`, 8, 900);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { type, firstName, lastName, phone, email, message, website } = parsed.data;
  if (website) {
    return NextResponse.json({ message: "Thank you for reaching out!" });
  }

  await prisma.contactSubmission.create({
    data: {
      type,
      firstName,
      lastName: lastName || null,
      phone,
      email: email || null,
      message,
      ipHash: hashIp(ip),
    },
  });

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  await emailService.sendBusinessInboxEmail({
    kind: type,
    subject:
      type === "BULK_ENQUIRY"
        ? `New Bulk Order Enquiry from ${fullName}`
        : `New Contact Message from ${fullName}`,
    fromName: fullName,
    phone,
    replyToEmail: email || null,
    message,
  });

  return NextResponse.json({ message: "Thank you! Your message has been sent to our team." }, { status: 201 });
}
