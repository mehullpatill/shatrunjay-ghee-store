import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/checkout`);
  }

  const cart = await prisma.cart.findUnique({ where: { sessionToken: token } });
  const response = NextResponse.redirect(`${siteUrl}/checkout`);

  if (cart && cart.status !== "CONVERTED") {
    response.cookies.set(CART_COOKIE_NAME, cart.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
