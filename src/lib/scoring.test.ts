import { describe, it, expect } from "vitest";
import { scoreOutcomePoints, computePoints, outcomeOf, type MatchResult, type PredictionInput } from "./scoring";

function result(homeScore: number, awayScore: number, extra: Partial<MatchResult> = {}): MatchResult {
  return {
    homeScore,
    awayScore,
    wentToPenalties: false,
    ...extra,
  };
}

function pred(predHomeScore: number, predAwayScore: number, extra: Partial<PredictionInput> = {}): PredictionInput {
  return {
    predHomeScore,
    predAwayScore,
    ...extra,
  };
}

describe("outcomeOf", () => {
  it("detects home win, away win, draw", () => {
    expect(outcomeOf(2, 1)).toBe("HOME_WIN");
    expect(outcomeOf(1, 2)).toBe("AWAY_WIN");
    expect(outcomeOf(1, 1)).toBe("DRAW");
  });
});

describe("scoreOutcomePoints — normal (non-penalty) matches", () => {
  it("exact score match = 3 points (user example: 4-0 actual, 4-0 predicted)", () => {
    expect(scoreOutcomePoints(result(4, 0), pred(4, 0))).toBe(3);
  });

  it("off by exactly one goal margin = 2 points (user example: 4-0 actual, 3-0 predicted)", () => {
    expect(scoreOutcomePoints(result(4, 0), pred(3, 0))).toBe(2);
  });

  it("off by a large margin = 1 point (user example: 4-0 actual, 10-0 predicted)", () => {
    expect(scoreOutcomePoints(result(4, 0), pred(10, 0))).toBe(1);
  });

  it("wrong direction entirely = 0 points (user example: 4-0 actual, 0-1 predicted)", () => {
    expect(scoreOutcomePoints(result(4, 0), pred(0, 1))).toBe(0);
  });

  it("correct draw direction, wrong exact score = 2 points (user example: 2-2 actual, 1-1 predicted)", () => {
    expect(scoreOutcomePoints(result(2, 2), pred(1, 1))).toBe(2);
  });

  it("equal margins but not exact score = 1 point, NOT 2 (user's explicit correction: 3-1 actual, 4-2 predicted)", () => {
    expect(scoreOutcomePoints(result(3, 1), pred(4, 2))).toBe(1);
  });

  it("minimal decisive off-by-one still = 2 points (1-0 actual, 2-0 predicted)", () => {
    expect(scoreOutcomePoints(result(1, 0), pred(2, 0))).toBe(2);
  });

  it("exact 0-0 = 3 points", () => {
    expect(scoreOutcomePoints(result(0, 0), pred(0, 0))).toBe(3);
  });

  it("margin diff of exactly 2 = 1 point (4-0 actual margin 4, 3-1 predicted margin 2, diff 2)", () => {
    expect(scoreOutcomePoints(result(4, 0), pred(3, 1))).toBe(1);
  });

  it("away win variants score symmetrically to home win", () => {
    expect(scoreOutcomePoints(result(0, 4), pred(0, 4))).toBe(3); // exact
    expect(scoreOutcomePoints(result(0, 4), pred(0, 3))).toBe(2); // margin diff 1
    expect(scoreOutcomePoints(result(0, 4), pred(0, 10))).toBe(1); // margin diff 6
  });
});

describe("scoreOutcomePoints — knockout matches decided by penalties", () => {
  const penaltyResult = (penaltyWinnerIsHome: boolean) =>
    result(1, 1, { wentToPenalties: true, penaltyWinnerIsHome });

  it("correctly predicted the advancing (home) team = 2 points", () => {
    expect(scoreOutcomePoints(penaltyResult(true), pred(2, 0))).toBe(2);
  });

  it("correctly predicted the advancing (away) team = 2 points", () => {
    expect(scoreOutcomePoints(penaltyResult(false), pred(0, 2))).toBe(2);
  });

  it("predicted a draw = 1 point", () => {
    expect(scoreOutcomePoints(penaltyResult(true), pred(1, 1))).toBe(1);
    expect(scoreOutcomePoints(penaltyResult(false), pred(2, 2))).toBe(1);
  });

  it("predicted the eliminated team = 0 points", () => {
    expect(scoreOutcomePoints(penaltyResult(true), pred(0, 1))).toBe(0);
    expect(scoreOutcomePoints(penaltyResult(false), pred(1, 0))).toBe(0);
  });

  it("exact score prediction does NOT get the normal 3-point treatment in penalty mode", () => {
    // Actual 120-min score is 1-1; predicting 1-1 exactly is scored as "predicted a draw" = 1, not 3.
    expect(scoreOutcomePoints(penaltyResult(true), pred(1, 1))).toBe(1);
  });
});

describe("computePoints — admin-awarded bonuses", () => {
  it("awards max 5 points: exact score + both bonuses awarded", () => {
    expect(computePoints(result(2, 1), pred(2, 1), { bestPlayer: true, firstScorer: true })).toEqual({
      pointsScoreOutcome: 3,
      pointsBestPlayer: 1,
      pointsFirstScorer: 1,
      pointsTotal: 5,
    });
  });

  it("defaults to no bonuses when none are passed", () => {
    expect(computePoints(result(2, 1), pred(2, 1))).toEqual({
      pointsScoreOutcome: 3,
      pointsBestPlayer: 0,
      pointsFirstScorer: 0,
      pointsTotal: 3,
    });
  });

  it("bonuses are awarded independently even when the score prediction is wrong", () => {
    const points = computePoints(result(2, 1), pred(0, 3), { bestPlayer: true, firstScorer: false });
    expect(points.pointsScoreOutcome).toBe(0); // wrong direction entirely
    expect(points.pointsBestPlayer).toBe(1);
    expect(points.pointsTotal).toBe(1);
  });

  it("awards only the first-scorer bonus when that is the admin's decision", () => {
    const points = computePoints(result(0, 0), pred(0, 0), { bestPlayer: false, firstScorer: true });
    expect(points.pointsScoreOutcome).toBe(3); // exact 0-0
    expect(points.pointsBestPlayer).toBe(0);
    expect(points.pointsFirstScorer).toBe(1);
    expect(points.pointsTotal).toBe(4);
  });

  it("penalty-mode result still combines with awarded bonuses", () => {
    const r = result(1, 1, { wentToPenalties: true, penaltyWinnerIsHome: true });
    const points = computePoints(r, pred(2, 1), { bestPlayer: true, firstScorer: true });
    expect(points.pointsScoreOutcome).toBe(2); // called the advancing team
    expect(points.pointsBestPlayer).toBe(1);
    expect(points.pointsFirstScorer).toBe(1);
    expect(points.pointsTotal).toBe(4);
  });
});
