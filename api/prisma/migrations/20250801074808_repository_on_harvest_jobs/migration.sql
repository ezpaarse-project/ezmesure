-- AlterTable
ALTER TABLE "HarvestJob" ADD COLUMN     "repositoryPattern" TEXT;

-- AddForeignKey
ALTER TABLE "HarvestJob" ADD CONSTRAINT "HarvestJob_repositoryPattern_fkey" FOREIGN KEY ("repositoryPattern") REFERENCES "Repository"("pattern") ON DELETE SET NULL ON UPDATE CASCADE;
