import { prisma } from "@/lib/db";
import { MatchCard, type BestPredictionPreview, type PredictionPreview } from "@/components/MatchCard";
import { STAGE_LABELS } from "@/lib/labels";
import { isLocked } from "@/lib/matchLock";
import { getCurrentParticipant } from "@/lib/session";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getBestPredictions } from "@/lib/bestPredictions";

export const dynamic = "force-dynamic";

type MatchWithRelations = Awaited<ReturnType<typeof getMatches>>[number];

function getMatches() {
  return prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        include: { participant: { select: { displayName: true } } },
        orderBy: [{ pointsTotal: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}

function groupByStage(matches: MatchWithRelations[]) {
  const grouped = new Map<string, MatchWithRelations[]>();
  for (const match of matches) {
    const list = grouped.get(match.stage) ?? [];
    list.push(match);
    grouped.set(match.stage, list);
  }
  return grouped;
}

function MatchSection({
  title,
  matches,
  cardData,
  isAdmin,
  defaultOpen = true,
}: {
  title: string;
  matches: MatchWithRelations[];
  cardData: Map<
    string,
    {
      predictions: PredictionPreview[];
      bestPredictions: BestPredictionPreview[];
      hiddenPredictionCount: number;
      hasMyPrediction: boolean;
    }
  >;
  isAdmin: boolean;
  defaultOpen?: boolean;
}) {
  const grouped = groupByStage(matches);
  const content = (
    <div className="mt-4 space-y-6">
      {[...grouped.entries()].map(([stage, stageMatches]) => (
        <div key={stage}>
          <h3 className="mb-3 text-xs font-semibold text-brand-900/50">{STAGE_LABELS[stage]}</h3>
          <div className="space-y-3">
            {stageMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                id={match.id}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeSlotLabel={match.homeSlotLabel}
                awaySlotLabel={match.awaySlotLabel}
                kickoffAt={match.kickoffAt}
                status={match.status}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                index={index}
                predictions={cardData.get(match.id)?.predictions}
                bestPredictions={cardData.get(match.id)?.bestPredictions}
                hiddenPredictionCount={cardData.get(match.id)?.hiddenPredictionCount}
                isAdminView={isAdmin}
                hasMyPrediction={cardData.get(match.id)?.hasMyPrediction}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (matches.length === 0) {
    return (
      <section className="mb-8 rounded-2xl border border-brand-100 bg-white/70 p-4 dark:bg-surface/70">
        <h2 className="text-sm font-bold text-brand-700">{title}</h2>
        <p className="mt-3 text-sm text-brand-900/40">لا توجد مباريات في هذا القسم</p>
      </section>
    );
  }

  if (!defaultOpen) {
    return (
      <details className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-brand-200 dark:bg-brand-50/80" open={false}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-brand-700 marker:hidden">
          <span>{title}</span>
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-brand-100 dark:text-brand-800">{matches.length}</span>
        </summary>
        {content}
      </details>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-brand-100 bg-white/70 p-4 dark:bg-surface/70">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-brand-700">{title}</h2>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">{matches.length}</span>
      </div>
      {content}
    </section>
  );
}

export default async function MatchesPage() {
  const [matches, participant, isAdmin] = await Promise.all([
    getMatches(),
    getCurrentParticipant(),
    isAdminAuthenticated(),
  ]);

  // Visibility: a viewer sees their OWN guess always; others' guesses only once the
  // match locks (anti-copy). The admin sees every guess at all times.
  const cardData = new Map<
    string,
    {
      predictions: PredictionPreview[];
      bestPredictions: BestPredictionPreview[];
      hiddenPredictionCount: number;
      hasMyPrediction: boolean;
    }
  >();
  for (const match of matches) {
    const locked = isLocked(match.kickoffAt, match.status);
    const visible: PredictionPreview[] = [];
    let hidden = 0;
    let hasMyPrediction = false;
    for (const p of match.predictions) {
      const isMine = participant?.id === p.participantId;
      if (isMine) hasMyPrediction = true;
      if (isAdmin || locked || isMine) {
        visible.push({
          id: p.id,
          displayName: p.participant.displayName,
          predHomeScore: p.predHomeScore,
          predAwayScore: p.predAwayScore,
          predBestPlayerName: p.predBestPlayerName,
          predFirstScorerName: p.predFirstScorerName,
          pointsTotal: p.pointsTotal,
          isMine,
        });
      } else {
        hidden += 1;
      }
    }
    const bestPredictions: BestPredictionPreview[] =
      match.status === "FINISHED"
        ? getBestPredictions(
            match.predictions.map((p) => ({
              id: p.id,
              displayName: p.participant.displayName,
              predHomeScore: p.predHomeScore,
              predAwayScore: p.predAwayScore,
              predBestPlayerName: p.predBestPlayerName,
              predFirstScorerName: p.predFirstScorerName,
              pointsTotal: p.pointsTotal,
              createdAt: p.createdAt,
              isMine: participant?.id === p.participantId,
              rankLabel: "🏆",
            }))
          )
        : [];
    cardData.set(match.id, { predictions: visible, bestPredictions, hiddenPredictionCount: hidden, hasMyPrediction });
  }

  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const previousMatches = matches.filter((match) => match.status === "FINISHED" || match.kickoffAt < now);
  const todayMatches = matches.filter(
    (match) => match.status !== "FINISHED" && match.kickoffAt >= now && match.kickoffAt <= next24Hours
  );
  const upcomingMatches = matches.filter(
    (match) => match.status !== "FINISHED" && match.kickoffAt > next24Hours
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">المباريات</h1>

      <MatchSection
        title="مباريات اليوم"
        matches={todayMatches}
        cardData={cardData}
        isAdmin={isAdmin}
      />
      <MatchSection
        title="مباريات قادمة"
        matches={upcomingMatches}
        cardData={cardData}
        isAdmin={isAdmin}
      />
      <MatchSection
        title="المباريات السابقة"
        matches={previousMatches}
        cardData={cardData}
        isAdmin={isAdmin}
        defaultOpen={false}
      />

      {matches.length === 0 && (
        <p className="text-center text-brand-900/50">لا توجد مباريات بعد</p>
      )}
    </div>
  );
}
