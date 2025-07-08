-- AlterTable
ALTER TABLE "SushiCredentials" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletionTaskId" TEXT;

-- CreateTable
CREATE TABLE "SushiCredentialsDeletionTask" (
    "id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "indexPattern" TEXT NOT NULL,
    "canceled" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SushiCredentialsDeletionTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SushiCredentials" ADD CONSTRAINT "SushiCredentials_deletionTaskId_fkey" FOREIGN KEY ("deletionTaskId") REFERENCES "SushiCredentialsDeletionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
