import { NextResponse } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";
import { getLeaderboardStandings } from "@/lib/leaderboard";
import { publish } from "@/lib/realtime";

export const dynamic = "force-dynamic";

// Admin awards the two free-text bonuses (+1 each) one prediction at a time.
const bonusSchema = z.object({
  bestPlayer: z.boolean(),
  firstScorer: z.boolean(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ matchId: string; predictionId: string }> }
) {
  const guard = await requireAdmin();
  if (guard !== true) return guard;

  const { matchId, predictionId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = bonusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const prediction = await prisma.prediction.findUnique({ where: { id: predictionId } });
  if (!prediction || prediction.matchId !== matchId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const pointsBestPlayer = parsed.data.bestPlayer ? 1 : 0;
  const pointsFirstScorer = parsed.data.firstScorer ? 1 : 0;
  // Score-outcome is already computed at result entry; total is just the sum.
  const pointsTotal = prediction.pointsScoreOutcome + pointsBestPlayer + pointsFirstScorer;

  const updated = await prisma.prediction.update({
    where: { id: predictionId },
    data: { pointsBestPlayer, pointsFirstScorer, pointsTotal },
  });

  await writeAuditLog({
    action: "ADMIN_BONUS_AWARDED",
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    metadata: {
      matchId,
      predictionId,
      participantId: prediction.participantId,
      pointsBestPlayer,
      pointsFirstScorer,
    },
  });

  const standings = await getLeaderboardStandings();
  publish({ channel: "leaderboard", standings });

  return NextResponse.json({ prediction: updated });
}
