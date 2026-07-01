import { NextResponse } from "next/server";
import { getCurrentParticipant } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const participant = await getCurrentParticipant();
  if (!participant) return NextResponse.json({ participant: null });

  return NextResponse.json({
    participant: { id: participant.id, displayName: participant.displayName, email: participant.email },
  });
}
