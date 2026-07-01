import { prisma } from "./db";

export interface LeaderboardStanding {
  rank: number;
  id: string;
  displayName: string;
  total: number;
}

interface LeaderboardRow {
  id: string;
  displayName: string;
  total: bigint;
}

export async function getLeaderboardStandings(): Promise<LeaderboardStanding[]> {
  const rows = await prisma.$queryRaw<LeaderboardRow[]>`
    SELECT
      p.id,
      p."displayName",
      COALESCE(SUM(CASE WHEN m."excludeFromScoring" = false THEN pr."pointsTotal" ELSE 0 END), 0) AS total
    FROM "Participant" p
    LEFT JOIN "Prediction" pr ON pr."participantId" = p.id
    LEFT JOIN "Match" m ON m.id = pr."matchId"
    GROUP BY p.id, p."displayName"
    ORDER BY total DESC, p."displayName" ASC
  `;

  let rank = 0;
  let previousTotal: bigint | null = null;
  let position = 0;

  return rows.map((row) => {
    position += 1;
    if (previousTotal === null || row.total !== previousTotal) {
      rank = position;
      previousTotal = row.total;
    }
    return { rank, id: row.id, displayName: row.displayName, total: Number(row.total) };
  });
}
