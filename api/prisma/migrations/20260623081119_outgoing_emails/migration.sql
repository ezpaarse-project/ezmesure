-- CreateEnum
CREATE TYPE "OutgoingEmailStatus" AS ENUM ('sent', 'failed');

-- CreateTable
CREATE TABLE "OutgoingEmail" (
    "id" TEXT NOT NULL,
    "recipients" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OutgoingEmailStatus" NOT NULL,
    "subject" TEXT,
    "locale" VARCHAR(5),
    "template" TEXT,
    "errors" TEXT[],

    CONSTRAINT "OutgoingEmail_pkey" PRIMARY KEY ("id")
);
