export type Outcome = "HOME_WIN" | "AWAY_WIN" | "DRAW";

export function outcomeOf(home: number, away: number): Outcome {
  if (home > away) return "HOME_WIN";
  if (home < away) return "AWAY_WIN";
  return "DRAW";
}

export interface MatchResult {
  /** Goals at 90 or 120 minutes — EXCLUDES penalty-shootout kicks. */
  homeScore: number;
  awayScore: number;
  /** True only for a knockout match tied after 120 minutes. */
  wentToPenalties: boolean;
  /** Required iff wentToPenalties. */
  penaltyWinnerIsHome?: boolean;
}

export interface PredictionInput {
  predHomeScore: number;
  predAwayScore: number;
}

/**
 * Best-player / first-scorer bonuses (+1 each). These are NOT computed automatically:
 * participants now type free-text guesses, so the admin awards each bonus manually,
 * one prediction at a time. This just carries the admin's decision.
 */
export interface BonusAward {
  bestPlayer: boolean;
  firstScorer: boolean;
}

/**
 * Score-prediction points only (0-3). Does not include best player / first scorer bonuses.
 */
export function scoreOutcomePoints(result: MatchResult, pred: PredictionInput): number {
  const actual = outcomeOf(result.homeScore, result.awayScore);
  const predicted = outcomeOf(pred.predHomeScore, pred.predAwayScore);

  if (result.wentToPenalties) {
    // Actual is always DRAW here (tied through 120 min). Knockout matches MUST produce
    // a winner, so score against who actually advanced, not the tied scoreline.
    if (result.homeScore !== result.awayScore) {
      throw new Error("penalty_result_must_have_tied_scoreline");
    }
    if (typeof result.penaltyWinnerIsHome !== "boolean") {
      throw new Error("penalty_winner_required");
    }

    const advancing: Outcome = result.penaltyWinnerIsHome ? "HOME_WIN" : "AWAY_WIN";
    if (predicted === advancing) {
      const totalScorelineDiff = Math.abs(pred.predHomeScore - result.homeScore) + Math.abs(pred.predAwayScore - result.awayScore);
      return totalScorelineDiff === 1 ? 2 : 1; // advanced team + one-goal scoreline miss gets 2; broader misses get 1
    }
    if (predicted === "DRAW") return 1; // correctly read it as level, didn't call the winner
    return 0; // picked the team that got eliminated
  }

  // Normal path: decided inside 120 minutes, no shootout needed.
  if (predicted !== actual) return 0;
  if (pred.predHomeScore === result.homeScore && pred.predAwayScore === result.awayScore) return 3;
  if (actual === "DRAW") return 2; // correct draw direction, wrong exact score

  const homeScoreDiff = Math.abs(pred.predHomeScore - result.homeScore);
  const awayScoreDiff = Math.abs(pred.predAwayScore - result.awayScore);
  const totalScorelineDiff = homeScoreDiff + awayScoreDiff;
  return totalScorelineDiff === 1 ? 2 : 1; // Only a one-goal scoreline miss gets 2; broader misses get 1
}

export interface PointsBreakdown {
  pointsScoreOutcome: number;
  pointsBestPlayer: number;
  pointsFirstScorer: number;
  pointsTotal: number;
}

/**
 * Combines the automatic score-outcome points with the admin's manually-awarded bonuses
 * into a full breakdown. Bonuses are independent of whether the score prediction was right.
 */
export function computePoints(
  result: MatchResult,
  pred: PredictionInput,
  bonus: BonusAward = { bestPlayer: false, firstScorer: false }
): PointsBreakdown {
  const pointsScoreOutcome = scoreOutcomePoints(result, pred);
  const pointsBestPlayer = bonus.bestPlayer ? 1 : 0;
  const pointsFirstScorer = bonus.firstScorer ? 1 : 0;
  const pointsTotal = pointsScoreOutcome + pointsBestPlayer + pointsFirstScorer;
  return { pointsScoreOutcome, pointsBestPlayer, pointsFirstScorer, pointsTotal };
}
