import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";
import { computePoints } from "@/lib/scoring";
import { getMatchWinnerTeamId } from "@/lib/bracket";
import { getLeaderboardStandings } from "@/lib/leaderboard";
import { publish } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const resultSchema = z
  .object({
    homeScore: z.number().int().min(0).max(99),
    awayScore: z.number().int().min(0).max(99),
    wentToPenalties: z.boolean(),
    penaltyWinnerTeamId: z.string().min(1).nullable().optional(),
    bestPlayerName: z
      .string()
      .trim()
      .max(80)
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    firstScorerName: z
      .string()
      .trim()
      .max(80)
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((data) => !data.wentToPenalties || Boolean(data.penaltyWinnerTeamId), {
    message: "يجب اختيار الفريق الفائز بركلات الترجيح",
    path: ["penaltyWinnerTeamId"],
  })
  .refine((data) => !data.wentToPenalties || data.homeScore === data.awayScore, {
    message: "يجب أن تكون النتيجة متعادلة عند اللجوء لركلات الترجيح",
    path: ["homeScore"],
  });

export async function PUT(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { matchId } = await params;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!match.homeTeamId || !match.awayTeamId) {
    return NextResponse.json({ error: "teams_not_set" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const { homeScore, awayScore, wentToPenalties, penaltyWinnerTeamId, bestPlayerName, firstScorerName } =
    parsed.data;

  if (
    penaltyWinnerTeamId &&
    penaltyWinnerTeamId !== match.homeTeamId &&
    penaltyWinnerTeamId !== match.awayTeamId
  ) {
    return NextResponse.json({ error: "invalid_penalty_winner" }, { status: 400 });
  }

  const predictions = await prisma.prediction.findMany({ where: { matchId } });

  const updates = predictions.map((prediction) => {
    // Only the automatic score-outcome (0-3) is recomputed here. The best-player and
    // first-scorer bonuses are awarded manually by the admin per prediction and must be
    // preserved across result (re-)entry, so we carry the existing bonus columns through.
    const points = computePoints(
      {
        homeScore,
        awayScore,
        wentToPenalties,
        penaltyWinnerIsHome: wentToPenalties ? penaltyWinnerTeamId === match.homeTeamId : undefined,
      },
      {
        predHomeScore: prediction.predHomeScore,
        predAwayScore: prediction.predAwayScore,
      },
      {
        bestPlayer: prediction.pointsBestPlayer > 0,
        firstScorer: prediction.pointsFirstScorer > 0,
      }
    );

    return prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        pointsScoreOutcome: points.pointsScoreOutcome,
        pointsTotal: points.pointsTotal,
      },
    });
  });

  // Bracket propagation: the winner of this match fills any dependent knockout slots.
  const winnerTeamId = getMatchWinnerTeamId({
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeScore,
    awayScore,
    wentToPenalties,
    penaltyWinnerTeamId: wentToPenalties ? penaltyWinnerTeamId ?? null : null,
  });

  const propagations = winnerTeamId
    ? [
        prisma.match.updateMany({
          where: { homeSourceMatchId: matchId },
          data: { homeTeamId: winnerTeamId },
        }),
        prisma.match.updateMany({
          where: { awaySourceMatchId: matchId },
          data: { awayTeamId: winnerTeamId },
        }),
      ]
    : [];

  const [updatedMatch] = await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        wentToPenalties,
        penaltyWinnerTeamId: wentToPenalties ? penaltyWinnerTeamId : null,
        bestPlayerName,
        firstScorerName,
        status: "FINISHED",
        resultEnteredAt: new Date(),
      },
    }),
    ...updates,
    ...propagations,
  ]);

  await writeAuditLog({
    action: "ADMIN_RESULT_ENTERED",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: { matchId, homeScore, awayScore, wentToPenalties, penaltyWinnerTeamId, bestPlayerName, firstScorerName },
  });

  const standings = await getLeaderboardStandings();
  publish({ channel: "leaderboard", standings });

  return NextResponse.json({ match: updatedMatch, recalculated: predictions.length });
}
