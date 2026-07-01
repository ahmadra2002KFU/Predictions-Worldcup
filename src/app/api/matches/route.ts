import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json({ matches });
}
