-- CreateEnum
CREATE TYPE "SushiAlertType" AS ENUM ('HARVESTED_BUT_UNSUPPORTED', 'ENDPOINT');

-- CreateTable
CREATE TABLE "SushiAlert" (
    "id" TEXT NOT NULL,
    "type" "SushiAlertType" NOT NULL,
    "severity" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SushiAlert_pkey" PRIMARY KEY ("id")
);
