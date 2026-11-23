import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin } from "@/lib/security";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(5).max(2000),
  orderId: z.string().optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable(),
});

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const reviews = await prisma.productReview.findMany({
    where: { productId: id, status: "APPROVED" },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to write a review." }, { status: 401 });
  const { id: productId } = await context.params;
  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid review" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const order = parsed.data.orderId
    ? await prisma.order.findFirst({ where: { id: parsed.data.orderId, userId: user.id, status: { notIn: ["CANCELLED", "REFUNDED"] }, items: { some: { productId } } }, select: { id: true } })
    : await prisma.order.findFirst({ where: { userId: user.id, status: { notIn: ["CANCELLED", "REFUNDED"] }, items: { some: { productId } } }, orderBy: { createdAt: "desc" }, select: { id: true } });

  const existing = await prisma.productReview.findFirst({ where: { productId, userId: user.id, orderId: order?.id || null } });
  if (existing) return NextResponse.json({ error: "You have already reviewed this purchase." }, { status: 409 });

  const review = await prisma.productReview.create({
    data: {
      productId,
      userId: user.id,
      orderId: order?.id || null,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl || null,
      verifiedPurchase: Boolean(order),
      status: "PENDING",
    },
  });
  return NextResponse.json({ review, message: "Review submitted for approval." }, { status: 201 });
}
