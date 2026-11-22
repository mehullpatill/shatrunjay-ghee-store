import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return Response.json({ detail: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: session.id }, { customerEmail: session.email }],
    },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      queries: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ orders });
}
