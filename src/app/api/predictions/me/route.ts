import { NextResponse } from "next/server";
import { getCurrentParticipant } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const participant = await getCurrentParticipant();
  if (!participant) return NextResponse.json({ predictions: [] });

  const predictions = await prisma.prediction.findMany({
    where: { participantId: participant.id },
  });

  return NextResponse.json({ predictions });
}
