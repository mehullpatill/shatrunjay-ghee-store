import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, setSessionCookie } from "@/lib/auth";

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).optional().or(z.literal("")),
  password: z.string().min(6),
  referredByCode: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ detail: "Please fill in all fields (password min 6 characters)." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ detail: "An account with this email already exists." }, { status: 409 });
  }

  const codeBase = parsed.data.name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "SG";
  const referralCode = `${codeBase}${Math.floor(1000 + Math.random() * 9000)}`;

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone ? parsed.data.phone.trim() : null,
      passwordHash: hashPassword(parsed.data.password),
      role: "CUSTOMER",
      referralCode,
      referredByCode: parsed.data.referredByCode?.trim().toUpperCase() || null,
    },
  });

  const token = signSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  return Response.json(
    {
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, referralCode: user.referralCode },
    },
    { status: 201 }
  );
}
