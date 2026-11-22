import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryEta, validatePincodeFormat } from "@/lib/pricing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = (searchParams.get("pincode") || "").trim();

  if (!validatePincodeFormat(pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit Indian pincode." }, { status: 400 });
  }

  const record = await prisma.serviceablePincode.findUnique({ where: { pincode } });
  const isMumbai = Boolean(record?.isMumbai);
  const isCodAllowed = Boolean(record?.isCodAllowed);

  return NextResponse.json({
    pincode,
    isMumbai,
    isCodAllowed,
    deliveryEtaText: getDeliveryEta(isMumbai),
    city: record?.city ?? null,
    area: record?.area ?? null,
  });
}
