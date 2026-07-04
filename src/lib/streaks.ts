export interface StreakPredictionRow {
  participantId: string;
  matchId: string;
  kickoffAt: Date;
  pointsScoreOutcome: number;
}

export interface PredictionStreaks {
  currentStreak: number;
  bestStreak: number;
}

export const DEFAULT_STREAK_EXCLUDED_MATCH_IDS = new Set<string>([
  "cmr2h2pm3006b2tt56lqefhtt", // Belgium vs Senegal — permanently excluded by user request
  "cmr2h2pm5006c2tt54h9sizir", // USA/United States vs Bosnia & Herzegovina — permanently excluded
]);

export function computePredictionStreaks(
  rows: StreakPredictionRow[],
  excludedMatchIds: ReadonlySet<string> = DEFAULT_STREAK_EXCLUDED_MATCH_IDS
): Map<string, PredictionStreaks> {
  const byParticipant = new Map<string, StreakPredictionRow[]>();

  for (const row of rows) {
    if (excludedMatchIds.has(row.matchId)) continue;
    const participantRows = byParticipant.get(row.participantId) ?? [];
    participantRows.push(row);
    byParticipant.set(row.participantId, participantRows);
  }

  const streaks = new Map<string, PredictionStreaks>();

  for (const [participantId, participantRows] of byParticipant.entries()) {
    participantRows.sort((a, b) => {
      const timeDiff = a.kickoffAt.getTime() - b.kickoffAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.matchId.localeCompare(b.matchId);
    });

    let currentStreak = 0;
    let bestStreak = 0;

    for (const row of participantRows) {
      if (row.pointsScoreOutcome > 0) {
        currentStreak += 1;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    streaks.set(participantId, { currentStreak, bestStreak });
  }

  return streaks;
}
