import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: { where: { isActive: true }, orderBy: { name: "asc" } } } },
      awayTeam: { include: { players: { where: { isActive: true }, orderBy: { name: "asc" } } } },
      penaltyWinnerTeam: true,
    },
  });

  if (!match) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ match });
}
