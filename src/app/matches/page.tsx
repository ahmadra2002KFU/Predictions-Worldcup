import { prisma } from "@/lib/db";
import { MatchCard, type PredictionPreview } from "@/components/MatchCard";
import { STAGE_LABELS } from "@/lib/labels";
import { isLocked } from "@/lib/matchLock";
import { getCurrentParticipant } from "@/lib/session";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const [matches, participant, isAdmin] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoffAt: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          include: { participant: { select: { displayName: true } } },
          orderBy: [{ pointsTotal: "desc" }, { createdAt: "asc" }],
        },
      },
    }),
    getCurrentParticipant(),
    isAdminAuthenticated(),
  ]);

  // Visibility: a viewer sees their OWN guess always; others' guesses only once the
  // match locks (anti-copy). The admin sees every guess at all times.
  const cardData = new Map<
    string,
    { predictions: PredictionPreview[]; hiddenPredictionCount: number }
  >();
  for (const match of matches) {
    const locked = isLocked(match.kickoffAt, match.status);
    const visible: PredictionPreview[] = [];
    let hidden = 0;
    for (const p of match.predictions) {
      const isMine = participant?.id === p.participantId;
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
    cardData.set(match.id, { predictions: visible, hiddenPredictionCount: hidden });
  }

  const grouped = new Map<string, typeof matches>();
  for (const match of matches) {
    const list = grouped.get(match.stage) ?? [];
    list.push(match);
    grouped.set(match.stage, list);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">المباريات</h1>
      {[...grouped.entries()].map(([stage, stageMatches]) => (
        <section key={stage} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-brand-900/70">{STAGE_LABELS[stage]}</h2>
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
                hiddenPredictionCount={cardData.get(match.id)?.hiddenPredictionCount}
                isAdminView={isAdmin}
              />
            ))}
          </div>
        </section>
      ))}
      {matches.length === 0 && (
        <p className="text-center text-brand-900/50">لا توجد مباريات بعد</p>
      )}
    </div>
  );
}
