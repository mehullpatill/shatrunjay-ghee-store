import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { resolveAndValidateDiscount } from "@/lib/discount-server";

const validateSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotalPaise: z.number().int().min(1),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to apply a discount code." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid discount request" }, { status: 400 });
  }

  const result = await resolveAndValidateDiscount({
    code: parsed.data.code,
    subtotalPaise: parsed.data.subtotalPaise,
    userId: user.id,
  });

  if (result.error || !result.candidate) {
    return NextResponse.json({ error: result.error || "Invalid code" }, { status: 400 });
  }

  return NextResponse.json({
    code: result.candidate.code,
    kind: result.candidate.kind,
    discountPaise: result.discountPaise,
    totalPaise: result.totalPaise,
  });
}
