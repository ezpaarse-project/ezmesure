/*
  Warnings:

  - Added the required column `counterVersion` to the `HarvestJob` table without a default value. This is not possible if the table is not empty.

*/
-- Couldn't handle versions other than 5 before migration
-- AlterTable
ALTER TABLE "HarvestJob" ADD COLUMN     "counterVersion" TEXT NOT NULL DEFAULT '5';

-- Couldn't handle versions other than 5 before migration
-- AlterTable
ALTER TABLE "HarvestSession" ADD COLUMN     "allowedCounterVersions" TEXT[] DEFAULT ARRAY['5']::TEXT[];

-- Remove default values
-- AlterTable
ALTER TABLE "HarvestJob" ALTER COLUMN     "counterVersion" DROP DEFAULT;
-- AlterTable
ALTER TABLE "HarvestSession" ALTER COLUMN     "allowedCounterVersions" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SushiEndpoint" ADD COLUMN     "counterVersionsAvailability" JSONB NOT NULL DEFAULT '{}';
