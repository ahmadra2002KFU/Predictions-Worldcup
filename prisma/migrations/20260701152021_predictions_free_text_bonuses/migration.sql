/*
  Warnings:

  - You are about to drop the column `bestPlayerId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `firstScorerId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `predBestPlayerId` on the `Prediction` table. All the data in the column will be lost.
  - You are about to drop the column `predFirstScorerId` on the `Prediction` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ADMIN_BONUS_AWARDED';

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_bestPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_firstScorerId_fkey";

-- DropForeignKey
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_predBestPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "Prediction" DROP CONSTRAINT "Prediction_predFirstScorerId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "bestPlayerId",
DROP COLUMN "firstScorerId",
ADD COLUMN     "bestPlayerName" TEXT,
ADD COLUMN     "firstScorerName" TEXT;

-- AlterTable
ALTER TABLE "Prediction" DROP COLUMN "predBestPlayerId",
DROP COLUMN "predFirstScorerId",
ADD COLUMN     "predBestPlayerName" TEXT,
ADD COLUMN     "predFirstScorerName" TEXT;
