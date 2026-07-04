import { prisma } from "../src/lib/db";
import { computePoints } from "../src/lib/scoring";
import { getMatchWinnerTeamId } from "../src/lib/bracket";

const matchId = "cmr2h2pmf006h2tt5676o2ey0";
const homeScore = 3;
const awayScore = 2;

async function main() {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true, homeTeam: true, awayTeam: true },
  });

  if (!match) throw new Error("match_not_found");
  if (!match.homeTeamId || !match.awayTeamId) throw new Error("teams_not_set");

  const updates = match.predictions.map((prediction) => {
    const points = computePoints(
      { homeScore, awayScore, wentToPenalties: false },
      { predHomeScore: prediction.predHomeScore, predAwayScore: prediction.predAwayScore },
      {
        bestPlayer: prediction.pointsBestPlayer > 0,
        firstScorer: prediction.pointsFirstScorer > 0,
      }
    );

    return prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        pointsScoreOutcome: points.pointsScoreOutcome,
        pointsTotal: points.pointsTotal,
      },
    });
  });

  const winnerTeamId = getMatchWinnerTeamId({
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeScore,
    awayScore,
    wentToPenalties: false,
    penaltyWinnerTeamId: null,
  });

  const propagations = winnerTeamId
    ? [
        prisma.match.updateMany({ where: { homeSourceMatchId: matchId }, data: { homeTeamId: winnerTeamId } }),
        prisma.match.updateMany({ where: { awaySourceMatchId: matchId }, data: { awayTeamId: winnerTeamId } }),
      ]
    : [];

  const [updated] = await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        wentToPenalties: false,
        penaltyWinnerTeamId: null,
        status: "FINISHED",
        resultEnteredAt: new Date(),
      },
    }),
    ...updates,
    ...propagations,
  ]);

  console.log(JSON.stringify({
    matchId,
    home: match.homeTeam?.name,
    away: match.awayTeam?.name,
    score: `${homeScore}-${awayScore}`,
    status: updated.status,
    recalculated: match.predictions.length,
    winnerTeamId,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
