import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const ADMIN_NAV: [string, string][] = [
  ["Dashboard", "/admin"],
  ["Products & Catalogue", "/admin/products"],
  ["Orders", "/admin/orders"],
  ["Customers", "/admin/customers"],
  ["Discounts & Referrals", "/admin/discounts"],
  ["Pincodes & COD", "/admin/pincodes"],
  ["CMS & Pages", "/admin/cms"],
  ["Lab Reports", "/admin/lab-reports"],
  ["Inbox", "/admin/inbox"],
  ["Settings & 2FA", "/admin/settings"],
  ["Audit Log", "/admin/audit"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/admin");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="adm min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-kadhai text-white p-5 flex flex-col">
        <Link href="/admin" className="font-display text-xl font-extrabold text-ghee">
          Shatrunjay Admin
        </Link>
        <p className="mt-1 text-xs text-white/60 truncate">{user.email}</p>

        <nav className="mt-6 flex-1 space-y-1 text-sm">
          {ADMIN_NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-md px-3 py-2 text-white/85 hover:bg-kadhai-2 hover:text-ghee"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs">
          <Link href="/" className="block text-ghee hover:underline">
            ← View Storefront
          </Link>
        </div>
      </aside>

      <main className="p-5 md:p-8">{children}</main>
    </div>
  );
}
