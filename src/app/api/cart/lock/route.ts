import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE_NAME } from "@/lib/auth";
import { lockCartInventory } from "@/lib/cart-engine";

export async function POST() {
  try {
    const sessionToken = cookies().get(CART_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "No active cart found." }, { status: 404 });
    }
    const cart = await prisma.cart.findUnique({ where: { sessionToken } });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    }

    const result = await lockCartInventory(cart.id);
    return NextResponse.json({ ok: true, lockedUntil: result.lockedUntil });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to lock inventory";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

export async function DELETE() {
  try {
    const sessionToken = cookies().get(CART_COOKIE_NAME)?.value;
    if (!sessionToken) return NextResponse.json({ ok: true });
    const cart = await prisma.cart.findUnique({ where: { sessionToken } });
    if (cart) {
      await prisma.cartLock.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { status: "ACTIVE", lockedUntil: null },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Release lock error:", err);
    return NextResponse.json({ error: "Failed to release lock" }, { status: 500 });
  }
}
