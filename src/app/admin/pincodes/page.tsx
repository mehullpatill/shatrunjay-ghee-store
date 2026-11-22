import { prisma } from "@/lib/prisma";
import AdminPincodesClient from "@/components/admin/AdminPincodesClient";

export const dynamic = "force-dynamic";

export default async function AdminPincodesPage() {
  const pincodes = await prisma.serviceablePincode.findMany({
    orderBy: { pincode: "asc" },
    take: 500,
  });
  return <AdminPincodesClient pincodes={pincodes} />;
}
