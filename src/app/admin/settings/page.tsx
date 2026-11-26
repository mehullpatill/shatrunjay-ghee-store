import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/cms";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";
import { getEnv } from "@/lib/env";
import LeadrSettings from "@/components/leadr-admin/(panel)/settings/page";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (getEnv().COMMERCE_BACKEND === "leadr") return <LeadrSettings />;
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  return <AdminSettingsClient settings={settings} totpEnabled={Boolean(user?.totpEnabled)} />;
}
