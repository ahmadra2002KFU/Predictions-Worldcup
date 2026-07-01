import Link from "next/link";
import { getCurrentParticipant } from "@/lib/session";
import { RegisterForm } from "@/components/RegisterForm";
import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const participant = await getCurrentParticipant();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-surface px-6 py-24 text-center">
      <Logo size={104} />
      <h1 className="text-3xl font-bold text-brand-700">توقعات كأس العالم مع مفيد</h1>

      {participant ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-brand-900/80">
            أهلاً بك، <span className="font-semibold text-brand-700">{participant.displayName}</span>
          </p>
          <Link
            href="/matches"
            className="rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            عرض المباريات
          </Link>
          <LogoutButton />
        </div>
      ) : (
        <>
          <p className="max-w-md text-brand-900/70">
            سجّل اسمك، توقع نتائج المباريات، وتنافس في لوحة الصدارة.
          </p>
          <RegisterForm />
          <Link href="/recover" className="text-sm text-brand-600 underline">
            نسيت حسابك؟ استرجعه هنا
          </Link>
        </>
      )}
    </div>
  );
}
