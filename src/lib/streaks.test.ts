import { describe, expect, it } from "vitest";
import { computePredictionStreaks, type StreakPredictionRow } from "./streaks";

function row(participantId: string, matchId: string, kickoffAt: string, pointsScoreOutcome: number): StreakPredictionRow {
  return {
    participantId,
    matchId,
    kickoffAt: new Date(kickoffAt),
    pointsScoreOutcome,
  };
}

describe("computePredictionStreaks", () => {
  it("counts consecutive finished scoring-enabled matches with score-outcome points", () => {
    const streaks = computePredictionStreaks([
      row("p1", "m1", "2026-06-01T10:00:00Z", 1),
      row("p1", "m2", "2026-06-02T10:00:00Z", 2),
      row("p1", "m3", "2026-06-03T10:00:00Z", 0),
      row("p1", "m4", "2026-06-04T10:00:00Z", 3),
      row("p1", "m5", "2026-06-05T10:00:00Z", 1),
    ]);

    expect(streaks.get("p1")).toEqual({ currentStreak: 2, bestStreak: 2 });
  });

  it("ignores excluded matches entirely instead of breaking or increasing streaks", () => {
    const streaks = computePredictionStreaks(
      [
        row("p1", "m1", "2026-06-01T10:00:00Z", 1),
        row("p1", "excluded", "2026-06-02T10:00:00Z", 0),
        row("p1", "m3", "2026-06-03T10:00:00Z", 2),
      ],
      new Set(["excluded"])
    );

    expect(streaks.get("p1")).toEqual({ currentStreak: 2, bestStreak: 2 });
  });

  it("does not count bonus-only points as a score prediction streak", () => {
    const streaks = computePredictionStreaks([
      row("p1", "m1", "2026-06-01T10:00:00Z", 1),
      row("p1", "m2", "2026-06-02T10:00:00Z", 0),
    ]);

    expect(streaks.get("p1")).toEqual({ currentStreak: 0, bestStreak: 1 });
  });

  it("returns zero streaks for participants with no finished scoring predictions", () => {
    const streaks = computePredictionStreaks([]);

    expect(streaks.get("missing")).toBeUndefined();
  });
});
