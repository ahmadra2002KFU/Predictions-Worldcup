import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      displayName: true,
      predictions: {
        where: { match: { status: "FINISHED" } },
        orderBy: { match: { kickoffAt: "asc" } },
        select: {
          id: true,
          predHomeScore: true,
          predAwayScore: true,
          predBestPlayerName: true,
          predFirstScorerName: true,
          pointsScoreOutcome: true,
          pointsBestPlayer: true,
          pointsFirstScorer: true,
          pointsTotal: true,
          match: {
            select: {
              id: true,
              stage: true,
              kickoffAt: true,
              status: true,
              excludeFromScoring: true,
              homeScore: true,
              awayScore: true,
              wentToPenalties: true,
              penaltyWinnerTeamId: true,
              bestPlayerName: true,
              firstScorerName: true,
              homeTeam: { select: { id: true, name: true, nameEn: true, flagEmoji: true } },
              awayTeam: { select: { id: true, name: true, nameEn: true, flagEmoji: true } },
              penaltyWinnerTeam: { select: { id: true, name: true, nameEn: true, flagEmoji: true } },
            },
          },
        },
      },
    },
  });

  if (!participant) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const predictions = participant.predictions.map((prediction) => ({
    id: prediction.id,
    match: {
      id: prediction.match.id,
      stage: prediction.match.stage,
      kickoffAt: prediction.match.kickoffAt.toISOString(),
      status: prediction.match.status,
      excludeFromScoring: prediction.match.excludeFromScoring,
      homeTeam: prediction.match.homeTeam,
      awayTeam: prediction.match.awayTeam,
      homeScore: prediction.match.homeScore,
      awayScore: prediction.match.awayScore,
      wentToPenalties: prediction.match.wentToPenalties,
      penaltyWinnerTeamId: prediction.match.penaltyWinnerTeamId,
      penaltyWinnerTeam: prediction.match.penaltyWinnerTeam,
      bestPlayerName: prediction.match.bestPlayerName,
      firstScorerName: prediction.match.firstScorerName,
    },
    prediction: {
      homeScore: prediction.predHomeScore,
      awayScore: prediction.predAwayScore,
      bestPlayerName: prediction.predBestPlayerName,
      firstScorerName: prediction.predFirstScorerName,
    },
    points: {
      scoreOutcome: prediction.pointsScoreOutcome,
      bestPlayer: prediction.pointsBestPlayer,
      firstScorer: prediction.pointsFirstScorer,
      total: prediction.pointsTotal,
      countedTotal: prediction.match.excludeFromScoring ? 0 : prediction.pointsTotal,
    },
  }));

  const summary = predictions.reduce(
    (acc, prediction) => {
      acc.predictions += 1;
      if (!prediction.match.excludeFromScoring) {
        acc.scoreOutcome += prediction.points.scoreOutcome;
        acc.bestPlayer += prediction.points.bestPlayer;
        acc.firstScorer += prediction.points.firstScorer;
        acc.total += prediction.points.countedTotal;
      }
      return acc;
    },
    { predictions: 0, scoreOutcome: 0, bestPlayer: 0, firstScorer: 0, total: 0 }
  );

  return NextResponse.json({
    participant: { id: participant.id, displayName: participant.displayName },
    summary,
    predictions,
  });
}
