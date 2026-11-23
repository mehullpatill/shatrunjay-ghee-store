import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { assertSameOrigin, getClientIp } from "@/lib/security";
import { emailService } from "@/lib/ses";

const updateOrderSchema = z.object({
  status: z.enum(["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  courierName: z.string().trim().max(120).optional().nullable(),
  courierDate: z.string().optional().nullable(),
  trackingNumber: z.string().trim().max(120).optional().nullable(),
  courierImageUrl: z.string().trim().max(500).optional().nullable(),
  courierImageKey: z.string().trim().max(300).optional().nullable(),
  cancelOrRefundNote: z.string().trim().max(500).optional().nullable(),
  historyNote: z.string().trim().max(400).optional().nullable(),
  shipmentStatus: z.enum(["PENDING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"]).optional(),
  trackingUrl: z.string().url().max(500).optional().nullable(),
  shipmentNotes: z.string().trim().max(500).optional().nullable(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.order.findUnique({ where: { id }, include: { user: true } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id },
      data: {
        status: d.status,
        paymentStatus: d.paymentStatus ?? existing.paymentStatus,
        courierName: d.courierName !== undefined ? d.courierName : existing.courierName,
        courierDate: d.courierDate ? new Date(d.courierDate) : existing.courierDate,
        trackingNumber: d.trackingNumber !== undefined ? d.trackingNumber : existing.trackingNumber,
        courierImageUrl: d.courierImageUrl !== undefined ? d.courierImageUrl : existing.courierImageUrl,
        courierImageKey: d.courierImageKey !== undefined ? d.courierImageKey : existing.courierImageKey,
        cancelOrRefundNote: d.cancelOrRefundNote !== undefined ? d.cancelOrRefundNote : existing.cancelOrRefundNote,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: d.status,
        note: d.historyNote || d.cancelOrRefundNote || `Status updated to ${d.status}`,
        changedByUserId: admin.id,
      },
    });

    if (d.shipmentStatus || d.trackingUrl !== undefined || d.shipmentNotes !== undefined || d.courierName !== undefined || d.trackingNumber !== undefined) {
      const shipment = await tx.shipment.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, status: d.shipmentStatus || "PENDING", courierName: d.courierName || null, trackingNumber: d.trackingNumber || null, trackingUrl: d.trackingUrl || null, notes: d.shipmentNotes || null, shippedAt: d.shipmentStatus === "SHIPPED" ? new Date() : null, deliveredAt: d.shipmentStatus === "DELIVERED" ? new Date() : null },
        update: { status: d.shipmentStatus, courierName: d.courierName !== undefined ? d.courierName : undefined, trackingNumber: d.trackingNumber !== undefined ? d.trackingNumber : undefined, trackingUrl: d.trackingUrl !== undefined ? d.trackingUrl : undefined, notes: d.shipmentNotes !== undefined ? d.shipmentNotes : undefined, shippedAt: d.shipmentStatus === "SHIPPED" ? new Date() : undefined, deliveredAt: d.shipmentStatus === "DELIVERED" ? new Date() : undefined },
      });
      if (d.shipmentStatus) await tx.shipmentEvent.create({ data: { shipmentId: shipment.id, status: d.shipmentStatus, note: d.shipmentNotes || d.historyNote || null } });
    }

    return order;
  });

  await recordAuditLog({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "UPDATE_ORDER",
    entityType: "Order",
    entityId: updated.id,
    beforeSummary: { status: existing.status, paymentStatus: existing.paymentStatus },
    afterSummary: { status: updated.status, paymentStatus: updated.paymentStatus, trackingNumber: updated.trackingNumber },
    ip: getClientIp(req),
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await emailService.sendOrderStatusEmail({
    toEmail: existing.user.email,
    name: existing.user.name,
    orderNumber: updated.orderNumber,
    status: updated.status,
    courierName: updated.courierName,
    trackingNumber: updated.trackingNumber,
    note: d.historyNote || d.cancelOrRefundNote,
    accountUrl: `${siteUrl}/account/orders/${updated.id}`,
  });

  return NextResponse.json({ order: updated });
}
