import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const Schema = z.object({
  type: z.enum(["CONTACT", "WHOLESALE", "BULK"]).default("CONTACT"),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  city: z.string().optional(),
  message: z.string().min(5),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ detail: "Please fill in all required fields." }, { status: 400 });
  }

  const inquiry = await prisma.contactInquiry.create({
    data: {
      source: parsed.data.type,
      firstName: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      whatsappNumber: parsed.data.phone.trim(),
      message: parsed.data.city ? `[City: ${parsed.data.city.trim()}] ${parsed.data.message.trim()}` : parsed.data.message.trim(),
    },
  });

  const adminEmail = process.env.SMTP_USER || "info@shatrunjayghee.com";
  sendEmail({
    to: adminEmail,
    subject: `[Shatrunjay ${parsed.data.type}] New inquiry from ${parsed.data.name}`,
    html: `<p><strong>Type:</strong> ${parsed.data.type}</p><p><strong>Name:</strong> ${parsed.data.name}</p><p><strong>Email:</strong> ${parsed.data.email}</p><p><strong>Phone:</strong> ${parsed.data.phone}</p>${parsed.data.city ? `<p><strong>City:</strong> ${parsed.data.city}</p>` : ""}<p><strong>Message:</strong><br/>${parsed.data.message}</p>`,
  }).catch(() => {});

  return Response.json({ ok: true, id: inquiry.id }, { status: 201 });
}
