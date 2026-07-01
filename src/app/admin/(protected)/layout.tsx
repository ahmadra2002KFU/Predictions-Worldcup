import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-brand-100 px-6 py-4">
        <nav className="mx-auto flex max-w-4xl items-center gap-6 text-sm">
          <Link href="/admin" className="font-bold text-brand-700">
            لوحة تحكم مفيد
          </Link>
          <Link href="/admin/teams" className="text-brand-900/70 hover:text-brand-700">
            الفرق
          </Link>
          <Link href="/admin/matches" className="text-brand-900/70 hover:text-brand-700">
            المباريات
          </Link>
          <Link href="/admin/participants" className="text-brand-900/70 hover:text-brand-700">
            المشاركون
          </Link>
          <Link href="/admin/audit-log" className="text-brand-900/70 hover:text-brand-700">
            سجل النشاط
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
