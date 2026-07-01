export interface WinnerInput {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  wentToPenalties: boolean;
  penaltyWinnerTeamId: string | null;
}

/**
 * The team that advances from a knockout match: the penalty-shootout winner if it
 * went to penalties, otherwise the side with more goals. Returns null when it can't
 * be determined (missing scores, or a draw with no shootout — invalid for knockouts).
 */
export function getMatchWinnerTeamId(m: WinnerInput): string | null {
  if (m.wentToPenalties) return m.penaltyWinnerTeamId ?? null;
  if (m.homeScore == null || m.awayScore == null) return null;
  if (m.homeScore > m.awayScore) return m.homeTeamId;
  if (m.awayScore > m.homeScore) return m.awayTeamId;
  return null;
}
