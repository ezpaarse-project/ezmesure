/*
  Warnings:

  - You are about to drop the column `beginDate` on the `HarvestJob` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `HarvestJob` table. All the data in the column will be lost.
  - You are about to drop the column `forceDownload` on the `HarvestJob` table. All the data in the column will be lost.
  - You are about to drop the column `harvestId` on the `HarvestJob` table. All the data in the column will be lost.
  - You are about to drop the column `ignoreValidation` on the `HarvestJob` table. All the data in the column will be lost.
  - You are about to drop the column `params` on the `HarvestJob` table. All the data in the column will be lost.
  - You are about to drop the column `timeout` on the `HarvestJob` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `HarvestJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HarvestJob" DROP COLUMN "beginDate",
DROP COLUMN "endDate",
DROP COLUMN "forceDownload",
DROP COLUMN "harvestId",
DROP COLUMN "ignoreValidation",
DROP COLUMN "params",
DROP COLUMN "timeout",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "HarvestSession" (
    "id" TEXT NOT NULL,
    "beginDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "credentialsQuery" JSONB NOT NULL,
    "reportTypes" TEXT[],
    "timeout" INTEGER NOT NULL DEFAULT 600,
    "allowFaulty" BOOLEAN NOT NULL DEFAULT false,
    "downloadUnsupported" BOOLEAN NOT NULL DEFAULT false,
    "forceDownload" BOOLEAN NOT NULL DEFAULT false,
    "ignoreValidation" BOOLEAN,
    "params" JSONB DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HarvestSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HarvestJob" ADD CONSTRAINT "HarvestJob_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HarvestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
