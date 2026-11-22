import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderQuerySchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/security";
import { emailService } from "@/lib/ses";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let user;
  try {
    user = await requireRole();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({ where: { id } });
  // Prevent IDOR: verify ownership
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const query = await prisma.orderQuery.create({
    data: {
      orderId: order.id,
      userId: user.id,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });

  await emailService.sendBusinessInboxEmail({
    kind: "ORDER_QUERY",
    subject: `Order Query [${order.orderNumber}]: ${parsed.data.subject}`,
    fromName: user.name,
    phone: user.phone || undefined,
    replyToEmail: user.email,
    orderNumber: order.orderNumber,
    message: parsed.data.message,
  });

  return NextResponse.json({ query }, { status: 201 });
}
