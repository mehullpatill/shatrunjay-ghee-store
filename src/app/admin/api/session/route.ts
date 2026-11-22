import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { crossSite } from "@/lib/adminSession";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  if (crossSite(req)) return Response.json({ error: "denied" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.trim().toLowerCase() },
  });

  if (!user || user.role !== "ADMIN" || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return Response.json({ error: "denied" }, { status: 401 });
  }

  const token = signSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  return Response.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
}

export async function DELETE(req: Request) {
  if (crossSite(req)) return Response.json({ error: "denied" }, { status: 403 });
  await clearSessionCookie();
  return Response.json({ ok: true });
}
