import { leadr } from "@/lib/leadr";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { phone?: unknown; email?: unknown } | null;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const email = typeof body?.email === "string" && body.email.trim() ? body.email.trim() : null;
  if (!/^\+?[0-9 ]{10,15}$/.test(phone)) return Response.json({ detail: "Enter a valid phone number." }, { status: 400 });
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email))) return Response.json({ detail: "Enter a valid email." }, { status: 400 });
  const forwarded = (req.headers.get("x-forwarded-for") ?? "").split(",").pop()?.trim() || "unknown";
  const response = await leadr("/storefront/otp", {
    method: "POST",
    body: JSON.stringify({ phone, email }),
    headers: { "X-Shop-Visitor": forwarded },
  }).catch(() => null);
  if (!response) return Response.json({ detail: "Shop is temporarily unavailable. Please try again." }, { status: 502 });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}
