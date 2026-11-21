import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthError, requireUser } from "@/lib/auth";
import { getAdminInquiryEmail, sendEmail } from "@/lib/email";

const querySchema = z.object({
  subject: z.string().min(3).max(150),
  message: z.string().min(5).max(3000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = querySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter subject and message." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order || (order.userId !== user.id && order.customerEmail !== user.email)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const query = await prisma.orderQuery.create({
      data: {
        orderId: order.id,
        userId: user.id,
        subject: parsed.data.subject.trim(),
        message: parsed.data.message.trim(),
      },
    });

    await sendEmail({
      to: getAdminInquiryEmail(),
      replyTo: user.email,
      subject: `[Order Query #${order.orderNumber}] ${parsed.data.subject}`,
      html: `
        <h2>Order Support Query</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${user.name} (${user.email})</p>
        <p><strong>Subject:</strong> ${parsed.data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${parsed.data.message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({ query }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to submit order query" }, { status: 500 });
  }
}
