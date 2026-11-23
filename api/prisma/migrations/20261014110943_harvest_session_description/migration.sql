-- AlterTable
ALTER TABLE "HarvestSession" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';

-- Add previous ID (they were used to identigy sessions) as description
UPDATE "HarvestSession" SET description = "HarvestSession".id;
