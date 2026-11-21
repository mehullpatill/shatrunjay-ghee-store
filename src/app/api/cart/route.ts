import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE_NAME, getSessionUser } from "@/lib/auth";
import { computeDiscount, getAvailableStock, releaseExpiredLocks } from "@/lib/cart-engine";

async function getOrCreateCart() {
  await releaseExpiredLocks();
  const cookieStore = cookies();
  let sessionToken = cookieStore.get(CART_COOKIE_NAME)?.value;
  const user = await getSessionUser();

  let cart = sessionToken
    ? await prisma.cart.findUnique({
        where: { sessionToken },
        include: { items: { include: { product: true } } },
      })
    : null;

  if (!cart || cart.status === "CONVERTED") {
    sessionToken = crypto.randomBytes(24).toString("hex");
    cart = await prisma.cart.create({
      data: {
        sessionToken,
        userId: user?.id || null,
        emailForRecovery: user?.email || null,
        customerName: user?.name || null,
      },
      include: { items: { include: { product: true } } },
    });
  } else if (user && !cart.userId) {
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        userId: user.id,
        emailForRecovery: cart.emailForRecovery || user.email,
        customerName: cart.customerName || user.name,
      },
      include: { items: { include: { product: true } } },
    });
  }

  return { cart, sessionToken: cart.sessionToken, userId: user?.id || null };
}

async function formatCartResponse(cartId: string, userId: string | null) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: true },
        orderBy: { product: { sortOrder: "asc" } },
      },
    },
  });
  if (!cart) return null;

  const subtotalInr = cart.items.reduce((sum, item) => sum + item.product.priceInr * item.quantity, 0);
  const discountResult = await computeDiscount({
    code: cart.appliedCode,
    subtotalInr,
    userId,
  });

  return {
    id: cart.id,
    status: cart.status,
    lockedUntil: cart.lockedUntil,
    appliedCode: discountResult.appliedCode,
    discountReason: discountResult.reason,
    emailForRecovery: cart.emailForRecovery,
    subtotalInr,
    discountInr: discountResult.discountInr,
    totalInr: Math.max(0, subtotalInr - discountResult.discountInr),
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.product.sku,
      name: item.product.name,
      slug: item.product.slug,
      volumeLabel: item.product.volumeLabel,
      priceInr: item.product.priceInr,
      imagesJson: item.product.imagesJson,
      quantity: item.quantity,
      lineTotalInr: item.product.priceInr * item.quantity,
    })),
  };
}

function attachCartCookie(res: NextResponse, sessionToken: string) {
  res.cookies.set(CART_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function GET() {
  try {
    const { cart, sessionToken, userId } = await getOrCreateCart();
    const formatted = await formatCartResponse(cart.id, userId);
    return attachCartCookie(NextResponse.json({ cart: formatted }), sessionToken);
  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

const upsertItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(500),
  mode: z.enum(["set", "increment"]).default("set"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = upsertItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 });
    }

    const { cart, sessionToken, userId } = await getOrCreateCart();
    const { productId, quantity, mode } = parsed.data;

    const existingItem = cart.items.find((i) => i.productId === productId);
    const targetQuantity = mode === "increment" ? (existingItem?.quantity || 0) + quantity : quantity;

    if (targetQuantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) {
        return NextResponse.json({ error: "Product unavailable" }, { status: 404 });
      }
      const available = await getAvailableStock(productId, cart.id);
      if (targetQuantity > available) {
        return NextResponse.json(
          { error: `Only ${available} unit(s) currently available.` },
          { status: 409 }
        );
      }

      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        update: { quantity: targetQuantity, unitPriceInr: product.priceInr },
        create: { cartId: cart.id, productId, quantity: targetQuantity, unitPriceInr: product.priceInr },
      });
    }

    await prisma.cartLock.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: "ACTIVE", lockedUntil: null, lastActivityAt: new Date() },
    });

    const formatted = await formatCartResponse(cart.id, userId);
    return attachCartCookie(NextResponse.json({ cart: formatted }), sessionToken);
  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

const patchCartSchema = z.object({
  code: z.string().max(40).nullable().optional(),
  emailForRecovery: z.string().email().optional(),
  customerName: z.string().max(100).optional(),
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const parsed = patchCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart update" }, { status: 400 });
    }

    const { cart, sessionToken, userId } = await getOrCreateCart();
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        ...(parsed.data.code !== undefined ? { appliedCode: parsed.data.code?.trim().toUpperCase() || null } : {}),
        ...(parsed.data.emailForRecovery ? { emailForRecovery: parsed.data.emailForRecovery.trim().toLowerCase() } : {}),
        ...(parsed.data.customerName ? { customerName: parsed.data.customerName.trim() } : {}),
        lastActivityAt: new Date(),
      },
    });

    const formatted = await formatCartResponse(cart.id, userId);
    return attachCartCookie(NextResponse.json({ cart: formatted }), sessionToken);
  } catch (err) {
    console.error("PATCH /api/cart error:", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { cart, sessionToken, userId } = await getOrCreateCart();
    await prisma.cartLock.deleteMany({ where: { cartId: cart.id } });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: "ACTIVE", lockedUntil: null, appliedCode: null, lastActivityAt: new Date() },
    });
    const formatted = await formatCartResponse(cart.id, userId);
    return attachCartCookie(NextResponse.json({ cart: formatted }), sessionToken);
  } catch (err) {
    console.error("DELETE /api/cart error:", err);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
