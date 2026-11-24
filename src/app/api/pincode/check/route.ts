import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryEta, validatePincodeFormat } from "@/lib/pricing";
import { lookupIndianPostalPincode } from "@/lib/postal";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = (searchParams.get("pincode") || "").trim();

  if (!validatePincodeFormat(pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit Indian pincode." }, { status: 400 });
  }

  const record = await prisma.serviceablePincode.findUnique({ where: { pincode } });
  let postal: Awaited<ReturnType<typeof lookupIndianPostalPincode>> | null = null;
  if (!record) {
    try {
      postal = await lookupIndianPostalPincode(pincode);
    } catch {
      return NextResponse.json({ error: "Pincode verification is temporarily unavailable. Please try again." }, { status: 503 });
    }
    if (!postal.valid) return NextResponse.json({ error: "This pincode is not valid according to India Post." }, { status: 404 });
  }

  const isMumbai = record?.isMumbai ?? false;
  const isCodAllowed = Boolean(record?.isCodAllowed);

  return NextResponse.json({
    pincode,
    isServiceable: true,
    isMumbai,
    isCodAllowed,
    deliveryEtaText: getDeliveryEta(isMumbai),
    city: record?.city ?? postal?.city ?? null,
    state: postal?.state ?? null,
    area: record?.area ?? postal?.area ?? null,
  });
}
