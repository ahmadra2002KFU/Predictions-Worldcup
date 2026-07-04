import { prisma } from "./db";
import { computePredictionStreaks, type StreakPredictionRow } from "./streaks";

export interface LeaderboardStanding {
  rank: number;
  id: string;
  displayName: string;
  total: number;
  currentStreak: number;
  bestStreak: number;
}

interface LeaderboardRow {
  id: string;
  displayName: string;
  total: bigint;
}

export async function getLeaderboardStandings(): Promise<LeaderboardStanding[]> {
  const [rows, streakRows] = await Promise.all([
    prisma.$queryRaw<LeaderboardRow[]>`
      SELECT
        p.id,
        p."displayName",
        COALESCE(SUM(CASE WHEN m."excludeFromScoring" = false THEN pr."pointsTotal" ELSE 0 END), 0) AS total
      FROM "Participant" p
      LEFT JOIN "Prediction" pr ON pr."participantId" = p.id
      LEFT JOIN "Match" m ON m.id = pr."matchId"
      GROUP BY p.id, p."displayName"
      ORDER BY total DESC, p."displayName" ASC
    `,
    prisma.$queryRaw<StreakPredictionRow[]>`
      SELECT
        pr."participantId",
        pr."matchId",
        m."kickoffAt",
        pr."pointsScoreOutcome"
      FROM "Prediction" pr
      INNER JOIN "Match" m ON m.id = pr."matchId"
      WHERE m.status = 'FINISHED'
        AND m."excludeFromScoring" = false
      ORDER BY pr."participantId" ASC, m."kickoffAt" ASC, pr."matchId" ASC
    `,
  ]);

  const streaksByParticipant = computePredictionStreaks(streakRows);

  let rank = 0;
  let previousTotal: bigint | null = null;
  let position = 0;

  return rows.map((row) => {
    position += 1;
    if (previousTotal === null || row.total !== previousTotal) {
      rank = position;
      previousTotal = row.total;
    }
    const streaks = streaksByParticipant.get(row.id) ?? { currentStreak: 0, bestStreak: 0 };
    return {
      rank,
      id: row.id,
      displayName: row.displayName,
      total: Number(row.total),
      currentStreak: streaks.currentStreak,
      bestStreak: streaks.bestStreak,
    };
  });
}
