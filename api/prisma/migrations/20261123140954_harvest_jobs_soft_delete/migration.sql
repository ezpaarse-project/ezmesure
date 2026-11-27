-- DropForeignKey
ALTER TABLE "HarvestJob" DROP CONSTRAINT "HarvestJob_credentialsId_fkey";

-- DropForeignKey
ALTER TABLE "HarvestJob" DROP CONSTRAINT "HarvestJob_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "SushiCredentials" DROP CONSTRAINT "SushiCredentials_deletionTaskId_fkey";

-- AlterTable
ALTER TABLE "HarvestJob" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "credentialsId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "HarvestJob" ADD CONSTRAINT "HarvestJob_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "SushiCredentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestJob" ADD CONSTRAINT "HarvestJob_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HarvestSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SushiCredentials" ADD CONSTRAINT "SushiCredentials_deletionTaskId_fkey" FOREIGN KEY ("deletionTaskId") REFERENCES "SushiCredentialsDeletionTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
