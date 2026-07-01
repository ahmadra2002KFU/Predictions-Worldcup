import Link from "next/link";
import { prisma } from "@/lib/db";
import { CreateMatchForm } from "@/components/admin/CreateMatchForm";
import { TeamFlag } from "@/components/TeamFlag";
import { formatKickoff } from "@/lib/format";
import { STAGE_LABELS, STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const [matches, teams] = await Promise.all([
    prisma.match.findMany({ orderBy: { kickoffAt: "asc" }, include: { homeTeam: true, awayTeam: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">المباريات</h1>
      <CreateMatchForm teams={teams} />
      <ul className="divide-y divide-brand-100 rounded-lg border border-brand-100">
        {matches.map((match) => (
          <li key={match.id}>
            <Link
              href={`/admin/matches/${match.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-brand-50"
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="text-brand-900/50">{STAGE_LABELS[match.stage]}</span>
                <span className="flex items-center gap-1.5 font-medium text-brand-900">
                  <TeamFlag flagEmoji={match.homeTeam?.flagEmoji ?? null} size="sm" />
                  {match.homeTeam?.name ?? match.homeSlotLabel ?? "غير محدد"}
                  <span className="mx-1 text-brand-900/40">×</span>
                  {match.awayTeam?.name ?? match.awaySlotLabel ?? "غير محدد"}
                  <TeamFlag flagEmoji={match.awayTeam?.flagEmoji ?? null} size="sm" />
                </span>
              </span>
              <span className="flex items-center gap-3 text-sm text-brand-900/60">
                <span>{formatKickoff(match.kickoffAt)}</span>
                <span>{STATUS_LABELS[match.status]}</span>
              </span>
            </Link>
          </li>
        ))}
        {matches.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-brand-900/50">لا توجد مباريات بعد</li>
        )}
      </ul>
    </div>
  );
}
