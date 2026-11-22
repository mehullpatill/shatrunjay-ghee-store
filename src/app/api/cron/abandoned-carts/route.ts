import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const carts = await prisma.cart.findMany({
    where: {
      status: "ACTIVE",
      emailForRecovery: { not: null },
      reminderSentAt: null,
      lastActivityAt: { lt: cutoff },
      items: { some: {} },
    },
    include: { items: { include: { product: true } } },
    take: 50,
  });

  let sent = 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shatrunjayghee.com";
  for (const cart of carts) {
    if (!cart.emailForRecovery) continue;
    const itemList = cart.items.map((i) => `<li>${i.product.name} × ${i.quantity}</li>`).join("");
    await sendEmail({
      to: cart.emailForRecovery,
      subject: "Your Shatrunjay Ghee cart is waiting",
      html: `<p>Namaste ${cart.customerName || "there"},</p><p>You left pure Shatrunjay Ghee in your cart:</p><ul>${itemList}</ul><p><a href="${siteUrl}/checkout">Complete your order here</a>.</p>`,
    }).catch(() => {});
    await prisma.cart.update({
      where: { id: cart.id },
      data: { reminderSentAt: new Date(), status: "ABANDONED" },
    });
    sent++;
  }

  return Response.json({ ok: true, sent });
}
