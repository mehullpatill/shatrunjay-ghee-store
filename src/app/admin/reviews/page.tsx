import { prisma } from "@/lib/prisma";
import AdminReviewsClient from "@/components/admin/AdminReviewsClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.productReview.findMany({
    include: { product: { select: { name: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return <AdminReviewsClient reviews={reviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() }))} />;
}
