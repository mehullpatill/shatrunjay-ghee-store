import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const pincodes = await prisma.codPincode.findMany({ orderBy: { pincode: "asc" } });
    return NextResponse.json({ pincodes });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to fetch pincodes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const entries: Array<{ pincode: string; city?: string; state?: string; isMumbai?: boolean }> =
      Array.isArray(body.entries) ? body.entries : [body];

    let count = 0;
    for (const entry of entries) {
      const pin = String(entry.pincode || "").trim();
      if (!/^\d{6}$/.test(pin)) continue;
      await prisma.codPincode.upsert({
        where: { pincode: pin },
        update: {
          city: entry.city?.trim() || null,
          state: entry.state?.trim() || null,
          isMumbai: Boolean(entry.isMumbai ?? pin.startsWith("400")),
          isActive: true,
        },
        create: {
          pincode: pin,
          city: entry.city?.trim() || null,
          state: entry.state?.trim() || null,
          isMumbai: Boolean(entry.isMumbai ?? pin.startsWith("400")),
          isActive: true,
        },
      });
      count++;
    }

    return NextResponse.json({ ok: true, imported: count }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Failed to save pincodes" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.codPincode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 500 });
    return NextResponse.json({ error: "Failed to delete pincode" }, { status: 500 });
  }
}
