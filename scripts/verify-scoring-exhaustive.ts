import { scoreOutcomePoints, computePoints, outcomeOf, type MatchResult, type PredictionInput } from "../src/lib/scoring";

function result(homeScore: number, awayScore: number, extra: Partial<MatchResult> = {}): MatchResult {
  return { homeScore, awayScore, wentToPenalties: false, ...extra };
}

function pred(predHomeScore: number, predAwayScore: number): PredictionInput {
  return { predHomeScore, predAwayScore };
}

function referenceNormalScorePoints(resultHome: number, resultAway: number, predHome: number, predAway: number): number {
  const actual = outcomeOf(resultHome, resultAway);
  const predicted = outcomeOf(predHome, predAway);
  if (predicted !== actual) return 0;
  if (predHome === resultHome && predAway === resultAway) return 3;
  if (actual === "DRAW") return 2;
  return Math.abs(predHome - resultHome) + Math.abs(predAway - resultAway) === 1 ? 2 : 1;
}

function referencePenaltyScorePoints(penaltyWinnerIsHome: boolean, predHome: number, predAway: number): number {
  const predicted = outcomeOf(predHome, predAway);
  const advancing = penaltyWinnerIsHome ? "HOME_WIN" : "AWAY_WIN";
  if (predicted === advancing) return 2;
  if (predicted === "DRAW") return 1;
  return 0;
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const maxScore = Number(process.env.MAX_SCORE ?? 99);
let normalCases = 0;
let penaltyCases = 0;
let bonusCases = 0;

for (let resultHome = 0; resultHome <= maxScore; resultHome += 1) {
  for (let resultAway = 0; resultAway <= maxScore; resultAway += 1) {
    for (let predHome = 0; predHome <= maxScore; predHome += 1) {
      for (let predAway = 0; predAway <= maxScore; predAway += 1) {
        const expected = referenceNormalScorePoints(resultHome, resultAway, predHome, predAway);
        const actual = scoreOutcomePoints(result(resultHome, resultAway), pred(predHome, predAway));
        assertEqual(actual, expected, `normal ${resultHome}-${resultAway} prediction ${predHome}-${predAway}`);
        normalCases += 1;
      }
    }
  }
}

for (const penaltyWinnerIsHome of [true, false]) {
  for (let tiedScore = 0; tiedScore <= maxScore; tiedScore += 1) {
    for (let predHome = 0; predHome <= maxScore; predHome += 1) {
      for (let predAway = 0; predAway <= maxScore; predAway += 1) {
        const expected = referencePenaltyScorePoints(penaltyWinnerIsHome, predHome, predAway);
        const actual = scoreOutcomePoints(
          result(tiedScore, tiedScore, { wentToPenalties: true, penaltyWinnerIsHome }),
          pred(predHome, predAway)
        );
        assertEqual(
          actual,
          expected,
          `penalty winner=${penaltyWinnerIsHome ? "home" : "away"} tied=${tiedScore} prediction ${predHome}-${predAway}`
        );
        penaltyCases += 1;
      }
    }
  }
}

for (const pointsScoreOutcome of [0, 1, 2, 3]) {
  // Use representative predictions/results that produce each automatic score bucket.
  const representative =
    pointsScoreOutcome === 3
      ? { result: result(2, 1), pred: pred(2, 1) }
      : pointsScoreOutcome === 2
        ? { result: result(2, 1), pred: pred(2, 0) }
        : pointsScoreOutcome === 1
          ? { result: result(4, 0), pred: pred(10, 0) }
          : { result: result(4, 0), pred: pred(0, 1) };

  for (const bestPlayer of [false, true]) {
    for (const firstScorer of [false, true]) {
      const computed = computePoints(representative.result, representative.pred, { bestPlayer, firstScorer });
      assertEqual(computed.pointsScoreOutcome, pointsScoreOutcome, `bonus representative score bucket ${pointsScoreOutcome}`);
      assertEqual(computed.pointsBestPlayer, bestPlayer ? 1 : 0, "best-player bonus");
      assertEqual(computed.pointsFirstScorer, firstScorer ? 1 : 0, "first-scorer bonus");
      assertEqual(computed.pointsTotal, pointsScoreOutcome + (bestPlayer ? 1 : 0) + (firstScorer ? 1 : 0), "total points");
      bonusCases += 1;
    }
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      maxScore,
      normalCases,
      penaltyCases,
      bonusCases,
      totalCases: normalCases + penaltyCases + bonusCases,
    },
    null,
    2
  )
);
