import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = (searchParams.get("order") ?? "").trim();
  const phone = (searchParams.get("phone") ?? "").replace(/\D/g, "").slice(-10);

  if (!orderNumber) {
    return NextResponse.json({ detail: "Order number is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, statusHistory: { orderBy: { createdAt: "desc" } } },
  });

  if (!order || (phone && !order.customerPhone.replace(/\D/g, "").endsWith(phone))) {
    return NextResponse.json({ detail: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    order_number: order.orderNumber,
    status: order.orderStatus,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    total_paise: order.totalInr * 100,
    delivery_eta_text: order.deliveryEtaText,
    courier_name: order.courierName,
    tracking_number: order.trackingNumber,
    courier_dispatch_date: order.courierDispatchDate,
    courier_image_url: order.courierImageUrl,
    items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity, line_total_paise: i.lineTotalInr * 100 })),
    history: order.statusHistory,
  });
}
