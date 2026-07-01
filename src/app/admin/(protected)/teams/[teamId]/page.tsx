import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RosterManager } from "@/components/admin/RosterManager";

export const dynamic = "force-dynamic";

export default async function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { players: { orderBy: { name: "asc" } } },
  });

  if (!team) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">
        {team.flagEmoji} {team.name}
      </h1>
      <RosterManager teamId={team.id} players={team.players} />
    </div>
  );
}
