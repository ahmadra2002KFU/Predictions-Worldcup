import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [teamCount, matchCount, participantCount] = await Promise.all([
    prisma.team.count(),
    prisma.match.count(),
    prisma.participant.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">لوحة التحكم</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-brand-100 p-4 text-center">
          <p className="text-2xl font-bold text-brand-700">{teamCount}</p>
          <p className="text-sm text-brand-900/70">فرق</p>
        </div>
        <div className="rounded-lg border border-brand-100 p-4 text-center">
          <p className="text-2xl font-bold text-brand-700">{matchCount}</p>
          <p className="text-sm text-brand-900/70">مباريات</p>
        </div>
        <div className="rounded-lg border border-brand-100 p-4 text-center">
          <p className="text-2xl font-bold text-brand-700">{participantCount}</p>
          <p className="text-sm text-brand-900/70">مشاركون</p>
        </div>
      </div>
    </div>
  );
}
