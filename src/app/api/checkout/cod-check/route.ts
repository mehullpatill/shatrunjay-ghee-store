import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get("pincode")?.trim() || "";

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit Indian pincode." }, { status: 400 });
  }

  const [codRecord, settings] = await Promise.all([
    prisma.codPincode.findUnique({ where: { pincode } }),
    prisma.siteSetting.findUnique({ where: { id: "default" } }),
  ]);

  const codEligible = Boolean(codRecord && codRecord.isActive);
  const isMumbai = codRecord ? codRecord.isMumbai : pincode.startsWith("400");

  const deliveryEtaText = isMumbai
    ? settings?.mumbaiDeliveryNote ||
      "Deliveries in Mumbai will be done by Shatrunjay Team or Porter in 2 to 3 days."
    : settings?.outsideMumbaiDeliveryNote ||
      "Deliveries outside Mumbai will be done by courier in 5 to 7 working days.";

  return NextResponse.json({
    pincode,
    codEligible,
    isMumbai,
    city: codRecord?.city || null,
    state: codRecord?.state || null,
    deliveryEtaText,
  });
}
