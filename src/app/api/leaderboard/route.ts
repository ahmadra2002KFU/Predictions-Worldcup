import { NextResponse } from "next/server";
import { getLeaderboardStandings } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const standings = await getLeaderboardStandings();
  return NextResponse.json({ standings });
}
