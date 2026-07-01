import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/session";
import { predictionSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";
import { isLocked } from "@/lib/matchLock";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const participant = await getCurrentParticipant();
  if (!participant) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!rateLimit(`predict:${participant.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = predictionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const { matchId, predHomeScore, predAwayScore, predBestPlayerName, predFirstScorerName } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Can't predict a knockout match whose teams haven't been decided yet.
  if (!match.homeTeamId || !match.awayTeamId) {
    return NextResponse.json({ error: "teams_not_set" }, { status: 409 });
  }

  const existing = await prisma.prediction.findUnique({
    where: { participantId_matchId: { participantId: participant.id, matchId } },
  });

  // Source of truth: re-check the lock against the server clock immediately before writing.
  if (isLocked(match.kickoffAt, match.status)) {
    return NextResponse.json({ error: "locked" }, { status: 409 });
  }

  const prediction = await prisma.prediction.upsert({
    where: { participantId_matchId: { participantId: participant.id, matchId } },
    create: {
      participantId: participant.id,
      matchId,
      predHomeScore,
      predAwayScore,
      predBestPlayerName,
      predFirstScorerName,
    },
    update: {
      predHomeScore,
      predAwayScore,
      predBestPlayerName,
      predFirstScorerName,
    },
  });

  await writeAuditLog({
    action: existing ? "PREDICTION_UPDATE" : "PREDICTION_CREATE",
    participantId: participant.id,
    ip,
    userAgent,
    metadata: {
      matchId,
      before: existing
        ? {
            predHomeScore: existing.predHomeScore,
            predAwayScore: existing.predAwayScore,
            predBestPlayerName: existing.predBestPlayerName,
            predFirstScorerName: existing.predFirstScorerName,
          }
        : null,
      after: { predHomeScore, predAwayScore, predBestPlayerName, predFirstScorerName },
    },
  });

  return NextResponse.json({ prediction });
}
