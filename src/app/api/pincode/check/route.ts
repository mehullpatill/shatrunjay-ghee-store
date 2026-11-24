import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryEta, isApprovedMumbaiCodPincode, validatePincodeFormat } from "@/lib/pricing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = (searchParams.get("pincode") || "").trim();

  if (!validatePincodeFormat(pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit Indian pincode." }, { status: 400 });
  }

  const record = await prisma.serviceablePincode.findUnique({ where: { pincode } });
  if (!record) {
    return NextResponse.json({ error: "This pincode is not currently serviceable." }, { status: 404 });
  }

  const isMumbai = record.isMumbai;
  const isCodAllowed = record.isCodAllowed && isApprovedMumbaiCodPincode(pincode);

  return NextResponse.json({
    pincode,
    isServiceable: true,
    isMumbai,
    isCodAllowed,
    deliveryEtaText: getDeliveryEta(isMumbai),
    city: record?.city ?? null,
    area: record?.area ?? null,
  });
}
