-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "awaySlotLabel" TEXT,
ADD COLUMN     "awaySourceMatchId" TEXT,
ADD COLUMN     "homeSlotLabel" TEXT,
ADD COLUMN     "homeSourceMatchId" TEXT,
ALTER COLUMN "homeTeamId" DROP NOT NULL,
ALTER COLUMN "awayTeamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeSourceMatchId_fkey" FOREIGN KEY ("homeSourceMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awaySourceMatchId_fkey" FOREIGN KEY ("awaySourceMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
