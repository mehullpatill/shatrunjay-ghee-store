import { prisma } from "@/lib/prisma";
import { crossSite, getAdmin } from "@/lib/adminSession";
import { sendEmail } from "@/lib/email";
import { DiscountKind, DiscountType, OrderStatus, PaymentStatus } from "@prisma/client";

function toUiStatus(status: OrderStatus, paymentStatus: PaymentStatus): string {
  if (paymentStatus === "FAILED") return "payment_failed";
  switch (status) {
    case "PLACED":
      return "pending";
    case "CONFIRMED":
      return "confirmed";
    case "PACKED":
      return "processing";
    case "DISPATCHED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}

function fromUiStatus(status: string): OrderStatus | null {
  switch (status) {
    case "pending":
    case "PLACED":
      return "PLACED";
    case "confirmed":
    case "CONFIRMED":
      return "CONFIRMED";
    case "processing":
    case "PACKED":
      return "PACKED";
    case "shipped":
    case "DISPATCHED":
      return "DISPATCHED";
    case "delivered":
    case "DELIVERED":
      return "DELIVERED";
    case "cancelled":
    case "CANCELLED":
      return "CANCELLED";
    default:
      return null;
  }
}

function mapOrder(o: any) {
  return {
    id: o.id,
    contact_id: o.userId ?? o.customerEmail,
    order_number: o.orderNumber,
    source: (o.channel ?? "WEB").toLowerCase(),
    status: toUiStatus(o.orderStatus, o.paymentStatus),
    payment_method: o.paymentMethod === "RAZORPAY" ? "razorpay" : "cod",
    subtotal_paise: o.subtotalInr * 100,
    shipping_paise: 0,
    discount_paise: o.discountInr * 100,
    total_paise: o.totalInr * 100,
    paid_paise: o.paymentStatus === "PAID" ? o.totalInr * 100 : 0,
    created_at: o.createdAt.toISOString(),
    updated_at: o.updatedAt.toISOString(),
    vyapar_invoice_number: null,
    needs_human_help: (o.queries?.length ?? 0) > 0,
    shipping_address: {
      name: o.customerName,
      phone: o.customerPhone,
      email: o.customerEmail,
      address_line: o.shippingAddress,
      area: o.area ?? "",
      city: o.city,
      state: o.state,
      pincode: o.pincode,
    },
    contact_name: o.customerName,
    contact_phone: o.customerPhone,
    items: (o.items ?? []).map((it: any) => ({
      id: it.id,
      product_id: it.productId,
      product_name: it.productName,
      quantity: it.quantity,
      unit_price_paise: it.unitPriceInr * 100,
    })),
    events: (o.statusHistory ?? []).map((ev: any) => ({
      at: ev.createdAt.toISOString(),
      by: "admin",
      action: ev.note ? `${ev.status}: ${ev.note}` : ev.status,
    })),
  };
}

function mapProduct(p: any) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    price_paise: p.pricePaise,
    image_url: p.imageUrl,
    in_stock: p.inStock,
    stock_qty: p.stockQty,
    synced_from: null,
    pack_label: p.packLabel,
    created_at: p.createdAt.toISOString(),
  };
}

function mapPromo(d: any) {
  return {
    id: d.id,
    code: d.code,
    description: d.kind === "REFERRAL" ? "Referral code" : "Promo code",
    discount_type: d.discountType === "PERCENT" ? "percent" : "flat",
    discount_value: d.discountType === "PERCENT" ? d.value : d.value * 100,
    min_order_paise: d.minOrderInr * 100,
    max_discount_paise: (d.maxDiscountInr ?? 0) * 100,
    usage_limit: d.usageLimit ?? 0,
    per_contact_limit: 0,
    starts_at: null,
    expires_at: d.expiresAt ? d.expiresAt.toISOString() : null,
    is_active: d.isActive,
    times_used: d.usedCount,
    discount_given_paise: 0,
  };
}

function mapSettings(s: any) {
  const content = (s?.siteContentJson as Record<string, any>) ?? {};
  const defaultMsgs: Record<string, string> = {
    pending: "Thank you for ordering from Shatrunjay Ghee. Your order is received.",
    confirmed: "Your Shatrunjay Ghee order is confirmed and being prepared.",
    processing: "Your Shatrunjay Ghee order is packed and ready for dispatch.",
    shipped: "Your Shatrunjay Ghee order has been dispatched.",
    delivered: "Your Shatrunjay Ghee order has been delivered.",
    cancelled: "Your Shatrunjay Ghee order has been cancelled.",
    payment_pending: "Payment is pending for your Shatrunjay Ghee order.",
    payment_failed: "Payment failed for your Shatrunjay Ghee order.",
  };
  return {
    cod_enabled: s?.codEnabled ?? true,
    cod_min_amount_paise: content.cod_min_amount_paise ?? 0,
    cod_max_amount_paise: content.cod_max_amount_paise ?? 0,
    razorpay_enabled: s?.onlinePaymentEnabled ?? true,
    upi_enabled: s?.onlinePaymentEnabled ?? true,
    razorpay_connection_status: process.env.RAZORPAY_KEY_ID ? "connected" : "not_configured",
    shipping_charge_paise: s?.shippingChargePaise ?? 0,
    delivery_time_text: s?.deliveryTimeText ?? "2–3 days in Mumbai; 5–7 working days outside Mumbai",
    auto_confirm_orders: content.auto_confirm_orders ?? false,
    min_order_amount_paise: s?.minOrderAmountPaise ?? 0,
    max_order_amount_paise: content.max_order_amount_paise ?? 0,
    max_items_per_order: content.max_items_per_order ?? 0,
    order_number_prefix: content.order_number_prefix ?? "SG",
    support_phone: content.support_phone ?? "+91 81696 29908",
    handoff_number: content.handoff_number ?? "+91 81696 29908",
    status_messages: content.status_messages ?? {},
    default_status_messages: defaultMsgs,
    referrals_enabled: s?.referralSystemEnabled ?? false,
    referral_referee_discount_paise: (s?.referralDiscountValue ?? 10) * 100,
    referral_reward_paise: (s?.referralMaxDiscountInr ?? 250) * 100,
    stock_from_salesmanagement: false,
    site_content: content,
  };
}

async function handle(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (crossSite(req)) return Response.json({ detail: "Forbidden" }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return Response.json({ detail: "Not signed in" }, { status: 401 });

  const { path } = await params;
  const route = path.join("/");
  const url = new URL(req.url);
  const method = req.method;

  try {
    if (route === "settings") {
      if (method === "GET") {
        const s = await prisma.siteSetting.upsert({
          where: { id: "default" },
          create: { id: "default" },
          update: {},
        });
        return Response.json(mapSettings(s));
      }
      if (method === "PATCH") {
        const body = await req.json();
        const existing = await prisma.siteSetting.upsert({
          where: { id: "default" },
          create: { id: "default" },
          update: {},
        });
        const prevContent = (existing.siteContentJson as Record<string, any>) ?? {};
        const nextContent = { ...prevContent };

        if (body.site_content) Object.assign(nextContent, body.site_content);
        if (body.cod_min_amount_paise !== undefined) nextContent.cod_min_amount_paise = body.cod_min_amount_paise;
        if (body.cod_max_amount_paise !== undefined) nextContent.cod_max_amount_paise = body.cod_max_amount_paise;
        if (body.auto_confirm_orders !== undefined) nextContent.auto_confirm_orders = body.auto_confirm_orders;
        if (body.max_order_amount_paise !== undefined) nextContent.max_order_amount_paise = body.max_order_amount_paise;
        if (body.max_items_per_order !== undefined) nextContent.max_items_per_order = body.max_items_per_order;
        if (body.order_number_prefix !== undefined) nextContent.order_number_prefix = body.order_number_prefix;
        if (body.support_phone !== undefined) nextContent.support_phone = body.support_phone;
        if (body.handoff_number !== undefined) nextContent.handoff_number = body.handoff_number;
        if (body.status_messages !== undefined) nextContent.status_messages = body.status_messages;

        const updated = await prisma.siteSetting.update({
          where: { id: "default" },
          data: {
            siteContentJson: nextContent,
            codEnabled: body.cod_enabled ?? existing.codEnabled,
            onlinePaymentEnabled: body.razorpay_enabled ?? existing.onlinePaymentEnabled,
            shippingChargePaise: body.shipping_charge_paise ?? existing.shippingChargePaise,
            minOrderAmountPaise: body.min_order_amount_paise ?? existing.minOrderAmountPaise,
            deliveryTimeText: body.delivery_time_text ?? existing.deliveryTimeText,
            referralSystemEnabled: body.referrals_enabled ?? existing.referralSystemEnabled,
          },
        });
        return Response.json(mapSettings(updated));
      }
    }

    if (route === "products") {
      if (method === "GET") {
        const list = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
        return Response.json(list.map(mapProduct));
      }
      if (method === "POST") {
        const body = await req.json();
        const name = String(body.name ?? "").trim();
        if (!name) return Response.json({ detail: "Name is required" }, { status: 400 });
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
        const sku = body.sku ? String(body.sku).trim().toUpperCase() : `SG-${Date.now().toString().slice(-6)}`;
        const created = await prisma.product.create({
          data: {
            sku,
            name,
            slug,
            description: String(body.description ?? ""),
            pricePaise: Number(body.price_paise ?? 0),
            imageUrl: body.image_url ?? null,
            inStock: body.in_stock ?? true,
            stockQty: body.stock_qty !== null && body.stock_qty !== undefined ? Number(body.stock_qty) : 100,
            packLabel: body.pack_label ?? null,
          },
        });
        return Response.json(mapProduct(created), { status: 201 });
      }
    }

    if (path[0] === "products" && path.length === 2) {
      const id = path[1];
      if (method === "PATCH") {
        const body = await req.json();
        const updated = await prisma.product.update({
          where: { id },
          data: {
            ...(body.name !== undefined && { name: String(body.name) }),
            ...(body.description !== undefined && { description: String(body.description) }),
            ...(body.price_paise !== undefined && { pricePaise: Number(body.price_paise) }),
            ...(body.image_url !== undefined && { imageUrl: body.image_url }),
            ...(body.in_stock !== undefined && { inStock: Boolean(body.in_stock) }),
            ...(body.stock_qty !== undefined && { stockQty: body.stock_qty === null ? 100 : Number(body.stock_qty) }),
            ...(body.pack_label !== undefined && { packLabel: body.pack_label }),
          },
        });
        return Response.json(mapProduct(updated));
      }
      if (method === "DELETE") {
        await prisma.product.delete({ where: { id } });
        return new Response(null, { status: 204 });
      }
    }

    if (route === "orders" && method === "GET") {
      const list = await prisma.order.findMany({
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: "desc" } },
          queries: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return Response.json(list.map(mapOrder));
    }

    if (path[0] === "orders" && path.length === 3 && path[2] === "status" && method === "PATCH") {
      const id = path[1];
      const body = await req.json();
      const nextStatus = fromUiStatus(String(body.status ?? ""));
      if (!nextStatus) return Response.json({ detail: "Invalid status" }, { status: 400 });

      const updated = await prisma.order.update({
        where: { id },
        data: {
          orderStatus: nextStatus,
          statusHistory: {
            create: {
              status: nextStatus,
              note: body.note ?? `Updated to ${nextStatus}`,
            },
          },
        },
        include: { items: true, statusHistory: { orderBy: { createdAt: "desc" } }, queries: true },
      });

      if (updated.customerEmail) {
        sendEmail({
          to: updated.customerEmail,
          subject: `Order ${updated.orderNumber} — ${nextStatus}`,
          html: `<p>Dear ${updated.customerName},</p><p>Your Shatrunjay Ghee order <strong>${updated.orderNumber}</strong> status is now <strong>${nextStatus}</strong>.</p>`,
        }).catch(() => {});
      }

      return Response.json(mapOrder(updated));
    }

    if (path[0] === "orders" && path.length === 3 && path[2] === "payments") {
      const id = path[1];
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) return Response.json({ detail: "Order not found" }, { status: 404 });

      if (method === "GET") {
        if (order.paymentStatus !== "PAID") return Response.json([]);
        return Response.json([
          {
            id: order.razorpayPaymentId ?? `pay_${order.id}`,
            method: order.paymentMethod === "RAZORPAY" ? "razorpay" : "cod",
            amount_paise: order.totalInr * 100,
            status: "success",
            paid_on: order.updatedAt.toISOString(),
            note: order.razorpayOrderId ? `Razorpay: ${order.razorpayOrderId}` : "Recorded",
            source: "web",
            created_at: order.createdAt.toISOString(),
          },
        ]);
      }
      if (method === "POST") {
        const body = await req.json();
        await prisma.order.update({
          where: { id },
          data: {
            paymentStatus: "PAID",
            statusHistory: {
              create: {
                status: order.orderStatus,
                note: `Payment recorded (${body.method ?? "manual"}): ₹${Math.round(Number(body.amount_paise ?? 0) / 100)}`,
              },
            },
          },
        });
        return Response.json({ ok: true }, { status: 201 });
      }
    }

    if (path[0] === "orders" && path.length === 3 && path[2] === "shipment" && method === "POST") {
      const id = path[1];
      const body = await req.json();
      const updated = await prisma.order.update({
        where: { id },
        data: {
          orderStatus: "DISPATCHED",
          courierName: body.provider ?? null,
          trackingNumber: body.awb ?? null,
          courierDispatchDate: new Date(),
          statusHistory: {
            create: {
              status: "DISPATCHED",
              note: `Dispatched via ${body.provider ?? "Courier"}${body.awb ? ` (AWB: ${body.awb})` : ""}`,
            },
          },
        },
        include: { items: true, statusHistory: { orderBy: { createdAt: "desc" } }, queries: true },
      });
      return Response.json(mapOrder(updated));
    }

    if (route === "promo-codes") {
      if (method === "GET") {
        const promos = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
        return Response.json(promos.map(mapPromo));
      }
      if (method === "POST") {
        const body = await req.json();
        const isPercent = body.discount_type === "percent";
        const created = await prisma.discountCode.create({
          data: {
            code: String(body.code ?? "").trim().toUpperCase(),
            kind: DiscountKind.PROMO,
            discountType: isPercent ? DiscountType.PERCENT : DiscountType.FIXED,
            value: isPercent ? Number(body.discount_value) : Math.round(Number(body.discount_value) / 100),
            minOrderInr: Math.round(Number(body.min_order_paise ?? 0) / 100),
            maxDiscountInr: body.max_discount_paise ? Math.round(Number(body.max_discount_paise) / 100) : null,
            usageLimit: body.usage_limit ? Number(body.usage_limit) : null,
            expiresAt: body.expires_at ? new Date(body.expires_at) : null,
            isActive: body.is_active ?? true,
          },
        });
        return Response.json(mapPromo(created), { status: 201 });
      }
    }

    if (path[0] === "promo-codes" && path.length === 2) {
      const id = path[1];
      if (method === "PATCH") {
        const body = await req.json();
        const isPercent = body.discount_type === "percent";
        const updated = await prisma.discountCode.update({
          where: { id },
          data: {
            ...(body.code !== undefined && { code: String(body.code).trim().toUpperCase() }),
            ...(body.discount_type !== undefined && { discountType: isPercent ? DiscountType.PERCENT : DiscountType.FIXED }),
            ...(body.discount_value !== undefined && {
              value: isPercent ? Number(body.discount_value) : Math.round(Number(body.discount_value) / 100),
            }),
            ...(body.min_order_paise !== undefined && { minOrderInr: Math.round(Number(body.min_order_paise) / 100) }),
            ...(body.max_discount_paise !== undefined && {
              maxDiscountInr: body.max_discount_paise ? Math.round(Number(body.max_discount_paise) / 100) : null,
            }),
            ...(body.usage_limit !== undefined && { usageLimit: body.usage_limit ? Number(body.usage_limit) : null }),
            ...(body.expires_at !== undefined && { expiresAt: body.expires_at ? new Date(body.expires_at) : null }),
            ...(body.is_active !== undefined && { isActive: Boolean(body.is_active) }),
          },
        });
        return Response.json(mapPromo(updated));
      }
      if (method === "DELETE") {
        await prisma.discountCode.delete({ where: { id } });
        return new Response(null, { status: 204 });
      }
    }

    if (route === "referrals" && method === "GET") {
      const users = await prisma.user.findMany({ where: { role: "CUSTOMER" } });
      const orders = await prisma.order.findMany({ where: { discountCodeUsed: { not: null } } });
      const rows = users
        .map((u) => {
          const refOrders = orders.filter((o) => o.discountCodeUsed === u.referralCode);
          return {
            contact_id: u.id,
            name: u.name,
            phone: u.phone,
            referral_code: u.referralCode,
            orders_referred: refOrders.length,
            revenue_paise: refOrders.reduce((s, o) => s + o.totalInr * 100, 0),
            discount_given_paise: refOrders.reduce((s, o) => s + o.discountInr * 100, 0),
          };
        })
        .filter((r) => r.orders_referred > 0);
      return Response.json(rows);
    }

    if (route === "reports" && method === "GET") {
      const days = Number(url.searchParams.get("days") ?? 30);
      const since = new Date(Date.now() - days * 86400_000);
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: since } },
        include: { items: true },
        orderBy: { createdAt: "asc" },
      });

      const byStatus: Record<string, number> = {};
      const byMethod: Record<string, number> = {};
      const dailyMap = new Map<string, { date: string; orders: number; revenue_paise: number }>();
      const prodMap = new Map<string, { name: string; quantity: number; revenue_paise: number }>();
      const seenEmails = new Set<string>();
      let first = 0;
      let repeat = 0;
      let totalRevenuePaise = 0;
      let collectedPaise = 0;

      for (const o of orders) {
        const st = toUiStatus(o.orderStatus, o.paymentStatus);
        byStatus[st] = (byStatus[st] ?? 0) + 1;
        const pm = o.paymentMethod === "RAZORPAY" ? "razorpay" : "cod";
        byMethod[pm] = (byMethod[pm] ?? 0) + 1;

        const rev = o.totalInr * 100;
        totalRevenuePaise += rev;
        if (o.paymentStatus === "PAID") collectedPaise += rev;

        const dKey = o.createdAt.toISOString().slice(0, 10);
        const day = dailyMap.get(dKey) ?? { date: dKey, orders: 0, revenue_paise: 0 };
        day.orders += 1;
        day.revenue_paise += rev;
        dailyMap.set(dKey, day);

        if (seenEmails.has(o.customerEmail)) repeat += 1;
        else {
          seenEmails.add(o.customerEmail);
          first += 1;
        }

        for (const it of o.items) {
          const p = prodMap.get(it.productName) ?? { name: it.productName, quantity: 0, revenue_paise: 0 };
          p.quantity += it.quantity;
          p.revenue_paise += it.lineTotalInr * 100;
          prodMap.set(it.productName, p);
        }
      }

      return Response.json({
        total_orders: orders.length,
        total_revenue_paise: totalRevenuePaise,
        collected_paise: collectedPaise,
        outstanding_paise: totalRevenuePaise - collectedPaise,
        daily: Array.from(dailyMap.values()),
        by_status: byStatus,
        by_payment_method: byMethod,
        top_products: Array.from(prodMap.values()).sort((a, b) => b.revenue_paise - a.revenue_paise).slice(0, 10),
        first_vs_repeat: { first, repeat },
      });
    }

    if (route === "pincodes") {
      if (method === "GET") {
        const pins = await prisma.codPincode.findMany({ orderBy: { pincode: "asc" } });
        return Response.json(pins);
      }
      if (method === "POST") {
        const body = await req.json();
        const rows: { pincode: string; city?: string; state?: string; isMumbai?: boolean }[] = Array.isArray(body.pincodes)
          ? body.pincodes
          : [{ pincode: String(body.pincode ?? ""), city: body.city, state: body.state, isMumbai: Boolean(body.isMumbai) }];
        let count = 0;
        for (const row of rows) {
          const pin = String(row.pincode ?? "").trim();
          if (!/^\d{6}$/.test(pin)) continue;
          await prisma.codPincode.upsert({
            where: { pincode: pin },
            create: { pincode: pin, city: row.city ?? null, state: row.state ?? null, isMumbai: Boolean(row.isMumbai), isActive: true },
            update: { city: row.city ?? null, state: row.state ?? null, isMumbai: Boolean(row.isMumbai), isActive: true },
          });
          count++;
        }
        return Response.json({ ok: true, count });
      }
    }

    if (path[0] === "pincodes" && path.length === 2 && method === "DELETE") {
      await prisma.codPincode.delete({ where: { id: path[1] } });
      return new Response(null, { status: 204 });
    }

    if (route === "abandoned-carts" && method === "GET") {
      const carts = await prisma.cart.findMany({
        where: { items: { some: {} } },
        include: { items: { include: { product: true } } },
        orderBy: { lastActivityAt: "desc" },
        take: 100,
      });
      return Response.json(carts);
    }

    if (route === "inquiries" && method === "GET") {
      const inquiries = await prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" } });
      return Response.json(inquiries);
    }

    return Response.json({ detail: `Unknown admin route: ${route}` }, { status: 404 });
  } catch (err) {
    console.error("Admin API error:", err);
    return Response.json({ detail: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
