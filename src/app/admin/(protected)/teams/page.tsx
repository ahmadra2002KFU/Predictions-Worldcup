import Link from "next/link";
import { prisma } from "@/lib/db";
import { CreateTeamForm } from "@/components/admin/CreateTeamForm";
import { TeamFlag } from "@/components/TeamFlag";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">الفرق</h1>
      <CreateTeamForm />
      <ul className="divide-y divide-brand-100 rounded-lg border border-brand-100">
        {teams.map((team) => (
          <li key={team.id}>
            <Link
              href={`/admin/teams/${team.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-brand-50"
            >
              <span className="flex items-center gap-2.5">
                <TeamFlag flagEmoji={team.flagEmoji} size="sm" />
                <span className="font-medium text-brand-900">{team.name}</span>
                {team.nameEn && <span className="text-sm text-brand-900/50">({team.nameEn})</span>}
              </span>
              <span className="text-sm text-brand-900/60">{team._count.players} لاعب</span>
            </Link>
          </li>
        ))}
        {teams.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-brand-900/50">لا توجد فرق بعد</li>
        )}
      </ul>
    </div>
  );
}
