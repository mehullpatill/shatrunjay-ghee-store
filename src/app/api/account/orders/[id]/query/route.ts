import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const Schema = z.object({
  subject: z.string().min(3),
  message: z.string().min(5),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return Response.json({ detail: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ detail: "Please enter a subject and message." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      OR: [{ userId: session.id }, { customerEmail: session.email }],
    },
  });
  if (!order) return Response.json({ detail: "Order not found" }, { status: 404 });

  const query = await prisma.orderQuery.create({
    data: {
      orderId: order.id,
      userId: session.id,
      subject: parsed.data.subject.trim(),
      message: parsed.data.message.trim(),
    },
  });

  const adminEmail = process.env.SMTP_USER || "info@shatrunjayghee.com";
  sendEmail({
    to: adminEmail,
    subject: `[Order Query ${order.orderNumber}] ${parsed.data.subject}`,
    html: `<p>Customer <strong>${session.name}</strong> (${session.email}) raised a query for order <strong>${order.orderNumber}</strong>:</p><p>${parsed.data.message}</p>`,
  }).catch(() => {});

  return Response.json({ ok: true, query }, { status: 201 });
}
