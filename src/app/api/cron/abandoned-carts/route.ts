import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredLocks } from "@/lib/cart-engine";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await releaseExpiredLocks();

    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const staleCarts = await prisma.cart.findMany({
      where: {
        status: { in: ["ACTIVE", "LOCKED"] },
        lastActivityAt: { lt: thirtyMinsAgo },
        reminderSentAt: null,
        items: { some: {} },
      },
      include: { items: { include: { product: true } } },
    });

    let emailsSent = 0;
    for (const cart of staleCarts) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { status: "ABANDONED", reminderSentAt: new Date() },
      });

      if (cart.emailForRecovery) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const recoverUrl = `${siteUrl}/api/cart/recover?token=${encodeURIComponent(cart.sessionToken)}`;
        const itemLines = cart.items
          .map((i) => `<li>${i.product.name} × ${i.quantity} (₹${i.product.priceInr * i.quantity})</li>`)
          .join("");

        await sendEmail({
          to: cart.emailForRecovery,
          subject: "You left pure Shatrunjay Ghee in your cart",
          html: `
            <h2>Hi ${cart.customerName || "there"},</h2>
            <p>Your cart is waiting for you at Shatrunjay Ghee:</p>
            <ul>${itemLines}</ul>
            <p><a href="${recoverUrl}">Restore your cart & complete your order</a></p>
          `,
        });
        emailsSent++;
      }
    }

    return NextResponse.json({ ok: true, abandonedMarked: staleCarts.length, emailsSent });
  } catch (err) {
    console.error("Abandoned cart cron error:", err);
    return NextResponse.json({ error: "Cron execution failed" }, { status: 500 });
  }
}
