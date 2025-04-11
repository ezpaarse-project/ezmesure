/*
  Warnings:

  - Added the required column `beginDate` to the `HarvestJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `HarvestJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HarvestJob" ADD COLUMN     "beginDate" TEXT NOT NULL,
ADD COLUMN     "endDate" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SushiEndpoint" ADD COLUMN     "supportedData" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "supportedDataUpdatedAt" TIMESTAMP(3);
