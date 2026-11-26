import { leadr } from "@/lib/leadr";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = (url.searchParams.get("order") ?? "").trim();
  const phone = (url.searchParams.get("phone") ?? "").trim();
  if (!/^[A-Za-z0-9-]{1,40}$/.test(order) || !phone) {
    return Response.json({ detail: "Check the order number and phone number." }, { status: 400 });
  }
  const response = await leadr(`/storefront/orders/${encodeURIComponent(order)}?phone=${encodeURIComponent(phone)}`).catch(() => null);
  if (!response) return Response.json({ detail: "Shop is temporarily unavailable. Please try again." }, { status: 502 });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}
