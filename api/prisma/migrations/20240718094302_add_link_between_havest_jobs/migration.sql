-- AlterTable
ALTER TABLE "Harvest" ADD COLUMN     "harvestedById" TEXT;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_harvestedById_fkey" FOREIGN KEY ("harvestedById") REFERENCES "HarvestJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
