import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    await requireAdmin();
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        queries: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

    const order = await prisma.order.update({
      where: { id: body.id },
      data: {
        ...(body.orderStatus ? { orderStatus: body.orderStatus } : {}),
        ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
        ...(body.courierName !== undefined ? { courierName: body.courierName || null } : {}),
        ...(body.trackingNumber !== undefined ? { trackingNumber: body.trackingNumber || null } : {}),
        ...(body.courierDispatchDate !== undefined
          ? { courierDispatchDate: body.courierDispatchDate ? new Date(body.courierDispatchDate) : null }
          : {}),
        ...(body.courierImageUrl !== undefined ? { courierImageUrl: body.courierImageUrl || null } : {}),
        ...(body.orderStatus
          ? {
              statusHistory: {
                create: {
                  status: body.orderStatus,
                  note: body.note || `Updated to ${body.orderStatus}`,
                },
              },
            }
          : {}),
      },
      include: { items: true, statusHistory: { orderBy: { createdAt: "desc" } } },
    });

    if (body.notifyCustomer !== false) {
      await sendEmail({
        to: order.customerEmail,
        subject: `Order Update #${order.orderNumber} — ${order.orderStatus}`,
        html: `
          <h2>Order #${order.orderNumber} Status Update</h2>
          <p><strong>Status:</strong> ${order.orderStatus}</p>
          ${order.courierName ? `<p><strong>Courier:</strong> ${order.courierName}</p>` : ""}
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ""}
          ${order.courierImageUrl ? `<p><a href="${order.courierImageUrl}">View Dispatch Receipt / Photo</a></p>` : ""}
        `,
      });
    }

    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
