import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/cms";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  return <AdminSettingsClient settings={settings} totpEnabled={Boolean(user?.totpEnabled)} />;
}
