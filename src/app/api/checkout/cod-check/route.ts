import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = (url.searchParams.get("pincode") ?? "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    return Response.json({ detail: "Enter a valid 6-digit pincode" }, { status: 400 });
  }

  const setting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  const pinRow = await prisma.codPincode.findUnique({ where: { pincode } });
  const isMumbai = pinRow ? pinRow.isMumbai : pincode.startsWith("400");
  const codEnabledGlobal = setting?.codEnabled ?? true;
  const codEligible = codEnabledGlobal && Boolean(pinRow?.isActive);

  return Response.json({
    pincode,
    codEligible,
    isMumbai,
    city: pinRow?.city ?? (isMumbai ? "Mumbai" : null),
    state: pinRow?.state ?? (isMumbai ? "Maharashtra" : null),
    etaText: isMumbai ? "2–3 days in Mumbai" : "5–7 working days outside Mumbai",
  });
}
