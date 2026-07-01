import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EditMatchForm } from "@/components/admin/EditMatchForm";
import { EnterResultForm } from "@/components/admin/EnterResultForm";
import { PredictionsScoring } from "@/components/admin/PredictionsScoring";
import { toRiyadhLocalInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!match) notFound();

  const teamsSet = Boolean(match.homeTeam && match.awayTeam);

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    include: { participant: { select: { displayName: true } } },
    orderBy: { createdAt: "asc" },
  });

  const homeLabel = match.homeTeam?.name ?? match.homeSlotLabel ?? "غير محدد";
  const awayLabel = match.awayTeam?.name ?? match.awaySlotLabel ?? "غير محدد";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">
        {match.homeTeam?.flagEmoji} {homeLabel} × {awayLabel} {match.awayTeam?.flagEmoji}
      </h1>
      <EditMatchForm
        matchId={match.id}
        stage={match.stage}
        status={match.status}
        venue={match.venue}
        kickoffAtLocalRiyadh={toRiyadhLocalInputValue(match.kickoffAt)}
      />
      {teamsSet && match.homeTeamId && match.awayTeamId && match.homeTeam && match.awayTeam ? (
        <EnterResultForm
          matchId={match.id}
          stage={match.stage}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
          initial={{
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            wentToPenalties: match.wentToPenalties,
            penaltyWinnerTeamId: match.penaltyWinnerTeamId,
            bestPlayerName: match.bestPlayerName,
            firstScorerName: match.firstScorerName,
          }}
        />
      ) : (
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900/60">
          لم يُحدَّد الفريقان بعد (مباراة إقصائية تنتظر نتائج الجولة السابقة). يمكن إدخال النتيجة بعد تأهّل الفريقين.
        </div>
      )}

      <PredictionsScoring
        matchId={match.id}
        actualBestPlayerName={match.bestPlayerName}
        actualFirstScorerName={match.firstScorerName}
        predictions={predictions.map((p) => ({
          id: p.id,
          displayName: p.participant.displayName,
          predHomeScore: p.predHomeScore,
          predAwayScore: p.predAwayScore,
          predBestPlayerName: p.predBestPlayerName,
          predFirstScorerName: p.predFirstScorerName,
          pointsScoreOutcome: p.pointsScoreOutcome,
          pointsBestPlayer: p.pointsBestPlayer,
          pointsFirstScorer: p.pointsFirstScorer,
          pointsTotal: p.pointsTotal,
        }))}
      />
    </div>
  );
}
