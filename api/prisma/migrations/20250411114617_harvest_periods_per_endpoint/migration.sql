/*
  Warnings:

  - Added the required column `beginDate` to the `HarvestJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `HarvestJob` table without a default value. This is not possible if the table is not empty.

*/
-- Add new columns with default values to allow us to populate them
-- AlterTable
ALTER TABLE "HarvestJob" ADD COLUMN     "beginDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "endDate" TEXT NOT NULL DEFAULT '';

-- Populate data in the new columns
UPDATE "HarvestJob" AS job
SET "beginDate" = ses."beginDate"
FROM "HarvestSession" AS ses
WHERE job."sessionId" = ses."id";

UPDATE "HarvestJob" AS job
SET "endDate" = ses."endDate"
FROM "HarvestSession" AS ses
WHERE job."sessionId" = ses."id";

-- Remove default values
-- AlterTable
ALTER TABLE "HarvestJob" ALTER COLUMN     "beginDate" DROP DEFAULT,
ALTER COLUMN     "endDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SushiEndpoint" ADD COLUMN     "supportedData" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "supportedDataUpdatedAt" TIMESTAMP(3);