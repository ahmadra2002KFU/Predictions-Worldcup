import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/session";
import { PredictionForm } from "@/components/PredictionForm";
import { ChatPanel } from "@/components/ChatPanel";
import { TeamFlag } from "@/components/TeamFlag";
import { MatchPredictionsList } from "@/components/MatchPredictionsList";
import { formatKickoff } from "@/lib/format";
import { isLocked } from "@/lib/matchLock";
import { STAGE_LABELS, STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

function HeroSide({
  team,
  slotLabel,
}: {
  team: { name: string; flagEmoji: string | null } | null;
  slotLabel: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <TeamFlag flagEmoji={team?.flagEmoji ?? null} size="lg" />
      {team ? (
        <span className="text-sm font-semibold text-brand-900 sm:text-base">{team.name}</span>
      ) : (
        <span className="text-xs font-medium text-brand-900/50">{slotLabel ?? "غير محدد"}</span>
      )}
    </div>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  const [match, participant] = await Promise.all([
    prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    }),
    getCurrentParticipant(),
  ]);

  if (!match) notFound();

  const teamsSet = Boolean(match.homeTeam && match.awayTeam);
  const finished = match.status === "FINISHED";
  const locked = isLocked(match.kickoffAt, match.status);

  const myPrediction = participant
    ? await prisma.prediction.findUnique({
        where: { participantId_matchId: { participantId: participant.id, matchId } },
      })
    : null;

  // Everyone can see all predictions — but only once the match is locked, so no one
  // can copy others before kickoff.
  const allPredictions = locked
    ? await prisma.prediction.findMany({
        where: { matchId },
        include: {
          participant: { select: { displayName: true } },
        },
        orderBy: [{ pointsTotal: "desc" }, { createdAt: "asc" }],
      })
    : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between text-xs">
        <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
          {STAGE_LABELS[match.stage]}
        </span>
        <span className="text-brand-900/50">{STATUS_LABELS[match.status]}</span>
      </div>

      <div className="mb-6 rounded-2xl border border-brand-200/60 bg-surface p-6 shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <HeroSide team={match.homeTeam} slotLabel={match.homeSlotLabel} />
          <div className="text-center">
            {finished ? (
              <div className="rounded-2xl bg-brand-600 px-4 py-2 text-2xl font-bold tabular-nums text-white shadow-sm">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <span className="text-lg font-bold text-brand-900/30">VS</span>
            )}
          </div>
          <HeroSide team={match.awayTeam} slotLabel={match.awaySlotLabel} />
        </div>

        {finished && match.wentToPenalties && (
          <p className="mt-3 text-center text-xs text-brand-900/60">
            انتهت بركلات الترجيح لصالح{" "}
            {match.penaltyWinnerTeamId === match.homeTeamId ? match.homeTeam?.name : match.awayTeam?.name}
          </p>
        )}

        <p className="mt-4 text-center text-sm text-brand-900/50">
          {formatKickoff(match.kickoffAt)} — {match.venue}
        </p>

        {finished && (match.bestPlayerName || match.firstScorerName) && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-brand-100 pt-4 text-xs">
            {match.bestPlayerName && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">
                أفضل لاعب: {match.bestPlayerName}
              </span>
            )}
            {match.firstScorerName && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">
                أول هدف: {match.firstScorerName}
              </span>
            )}
          </div>
        )}
      </div>

      {!teamsSet ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-center text-brand-900/70">
          بانتظار تحديد الفريقين — سيصبح التوقع متاحاً بعد انتهاء المباريات المؤهِّلة.
        </div>
      ) : !participant ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-center">
          <p className="mb-3 text-brand-900/70">سجّل اسمك أولاً للمشاركة بالتوقع</p>
          <Link href="/" className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
            التسجيل
          </Link>
        </div>
      ) : match.status === "SCHEDULED" && match.homeTeam && match.awayTeam ? (
        <PredictionForm
          matchId={match.id}
          kickoffAt={match.kickoffAt}
          status={match.status}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
          initial={{
            predHomeScore: myPrediction?.predHomeScore ?? null,
            predAwayScore: myPrediction?.predAwayScore ?? null,
            predBestPlayerName: myPrediction?.predBestPlayerName ?? null,
            predFirstScorerName: myPrediction?.predFirstScorerName ?? null,
          }}
        />
      ) : null}

      {locked && (
        <MatchPredictionsList
          finished={finished}
          homeTeamName={match.homeTeam?.name ?? "المضيف"}
          awayTeamName={match.awayTeam?.name ?? "الضيف"}
          predictions={allPredictions.map((p) => ({
            id: p.id,
            displayName: p.participant.displayName,
            predHomeScore: p.predHomeScore,
            predAwayScore: p.predAwayScore,
            predBestPlayerName: p.predBestPlayerName,
            predFirstScorerName: p.predFirstScorerName,
            pointsTotal: p.pointsTotal,
            isMine: participant?.id === p.participantId,
          }))}
        />
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-brand-900">الدردشة</h2>
        <ChatPanel matchId={match.id} canSend={Boolean(participant)} />
      </div>
    </div>
  );
}
