import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminInquiryEmail, sendEmail } from "@/lib/email";

const contactSchema = z.object({
  source: z.enum(["CONTACT", "BULK_ORDER"]).default("CONTACT"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().or(z.literal("")),
  whatsappNumber: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().min(3).max(3000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Please fill all required fields." },
        { status: 400 }
      );
    }

    const inquiry = await prisma.contactInquiry.create({
      data: {
        source: parsed.data.source,
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName?.trim() || null,
        whatsappNumber: parsed.data.whatsappNumber.trim(),
        email: parsed.data.email?.trim() || null,
        message: parsed.data.message.trim(),
      },
    });

    const targetEmail = getAdminInquiryEmail();
    await sendEmail({
      to: targetEmail,
      replyTo: parsed.data.email || undefined,
      subject: `[${parsed.data.source === "BULK_ORDER" ? "Bulk Order" : "Contact"}] New message from ${parsed.data.firstName}`,
      html: `
        <h2>New ${parsed.data.source === "BULK_ORDER" ? "Bulk Order" : "Contact"} Inquiry</h2>
        <p><strong>Name:</strong> ${parsed.data.firstName} ${parsed.data.lastName || ""}</p>
        <p><strong>WhatsApp:</strong> ${parsed.data.whatsappNumber}</p>
        <p><strong>Email:</strong> ${parsed.data.email || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${parsed.data.message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({ inquiryId: inquiry.id, ok: true }, { status: 201 });
  } catch (err) {
    console.error("Contact inquiry error:", err);
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}
