import { describe, expect, it } from "vitest";
import { getBestPredictions, type PredictionWithPoints } from "./bestPredictions";

function prediction(displayName: string, pointsTotal: number, createdAt: string): PredictionWithPoints {
  return {
    id: displayName,
    displayName,
    pointsTotal,
    createdAt: new Date(createdAt),
  };
}

describe("getBestPredictions", () => {
  it("returns all predictions tied for the highest positive score", () => {
    const best = getBestPredictions([
      prediction("Ahmed", 2, "2026-07-01T10:00:00Z"),
      prediction("Hadeel", 2, "2026-07-01T10:01:00Z"),
      prediction("Other", 1, "2026-07-01T10:02:00Z"),
    ]);

    expect(best.map((p) => p.displayName)).toEqual(["Ahmed", "Hadeel"]);
  });

  it("returns an empty list when no one scored positive points", () => {
    const best = getBestPredictions([
      prediction("Ahmed", 0, "2026-07-01T10:00:00Z"),
      prediction("Hadeel", 0, "2026-07-01T10:01:00Z"),
    ]);

    expect(best).toEqual([]);
  });

  it("orders ties by creation time then display name for stable UI", () => {
    const best = getBestPredictions([
      prediction("Zed", 3, "2026-07-01T10:02:00Z"),
      prediction("Ahmed", 3, "2026-07-01T10:01:00Z"),
      prediction("Hadeel", 3, "2026-07-01T10:01:00Z"),
    ]);

    expect(best.map((p) => p.displayName)).toEqual(["Ahmed", "Hadeel", "Zed"]);
  });

  it("limits displayed best predictions when requested", () => {
    const best = getBestPredictions(
      [
        prediction("A", 2, "2026-07-01T10:00:00Z"),
        prediction("B", 2, "2026-07-01T10:01:00Z"),
        prediction("C", 2, "2026-07-01T10:02:00Z"),
      ],
      2
    );

    expect(best.map((p) => p.displayName)).toEqual(["A", "B"]);
  });

  it("does not limit tied best predictions by default", () => {
    const best = getBestPredictions([
      prediction("A", 2, "2026-07-01T10:00:00Z"),
      prediction("B", 2, "2026-07-01T10:01:00Z"),
      prediction("C", 2, "2026-07-01T10:02:00Z"),
      prediction("D", 2, "2026-07-01T10:03:00Z"),
    ]);

    expect(best.map((p) => p.displayName)).toEqual(["A", "B", "C", "D"]);
  });
});
