export interface PredictionWithPoints {
  id: string;
  displayName: string;
  pointsTotal: number;
  createdAt: Date;
}

export function getBestPredictions<T extends PredictionWithPoints>(predictions: T[], limit = Number.POSITIVE_INFINITY): T[] {
  const highestPositiveScore = Math.max(0, ...predictions.map((prediction) => prediction.pointsTotal));
  if (highestPositiveScore <= 0) return [];

  return predictions
    .filter((prediction) => prediction.pointsTotal === highestPositiveScore)
    .sort((a, b) => {
      const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (createdAtDiff !== 0) return createdAtDiff;
      return a.displayName.localeCompare(b.displayName, "ar");
    })
    .slice(0, limit);
}
