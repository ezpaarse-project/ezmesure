-- CreateEnum
CREATE TYPE "HarvestSessionStatus" AS ENUM ('prepared', 'starting', 'running', 'finished', 'stopping', 'stopped');

-- AlterTable
ALTER TABLE "HarvestSession" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "HarvestSessionStatus" NOT NULL DEFAULT 'prepared';
