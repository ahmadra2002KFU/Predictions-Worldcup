"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MatchNotifications } from "@/components/MatchNotifications";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-brand-100 bg-surface/85 backdrop-blur">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-sm font-bold text-brand-700 sm:text-base">توقعات كأس العالم</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/matches" className="text-brand-900/70 transition-colors hover:text-brand-700">
            المباريات
          </Link>
          <Link href="/leaderboard" className="text-brand-900/70 transition-colors hover:text-brand-700">
            الصدارة
          </Link>
          <MatchNotifications />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
