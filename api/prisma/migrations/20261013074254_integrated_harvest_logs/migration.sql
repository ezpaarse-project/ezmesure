/*
  Warnings:

  - You are about to drop the `Log` table. All data will be migrated but please make sure you have bakcups.
  - You are about to drop the `Step` table. All data will be migrated but please make sure you have bakcups.

*/
-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_jobId_fkey";

-- AlterTable
ALTER TABLE "HarvestJob" ADD COLUMN     "logs" JSONB[],
ADD COLUMN     "steps" JSONB[];

-- Add data from old tables
UPDATE "HarvestJob"
SET logs = result.logs
FROM (
  SELECT "Log"."jobId",
    array_agg(
        jsonb_build_object(
            'date',        to_char("Log"."date" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
            'level',      "Log"."level",
            'message',    "Log"."message"
        )
        ORDER BY "Log"."date"
    ) AS logs
  FROM "Log"
  GROUP BY "Log"."jobId"
) AS result
WHERE result."jobId" = "HarvestJob".id;

UPDATE "HarvestJob"
SET steps = result.steps
FROM (
  SELECT "Step"."jobId",
      array_agg(
          jsonb_build_object(
              'label',       "Step"."label",
              'status',      "Step"."status",
              'runningTime', "Step"."runningTime",
              'data',        "Step"."data",
              'startedAt',    to_char("Step"."startedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
              'createdAt',    to_char("Step"."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
              'updatedAt',    to_char("Step"."updatedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
          )
          ORDER BY "Step"."createdAt"
      ) AS steps
  FROM "Step"
  GROUP BY "Step"."jobId"
) AS result
WHERE result."jobId" = "HarvestJob".id;

-- DropTable
DROP TABLE "Log";

-- DropTable
DROP TABLE "Step";
