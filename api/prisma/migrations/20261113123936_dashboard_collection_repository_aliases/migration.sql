/*
  Warnings:

  - The primary key for the `SpaceDashboardCollection` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "SpaceDashboardCollection" DROP CONSTRAINT "SpaceDashboardCollection_repositoryPattern_fkey";

-- AlterTable
ALTER TABLE "SpaceDashboardCollection" DROP CONSTRAINT "SpaceDashboardCollection_pkey",
ADD COLUMN     "aliasPattern" TEXT,
ALTER COLUMN "repositoryPattern" DROP NOT NULL,
ADD CONSTRAINT "SpaceDashboardCollection_pkey" PRIMARY KEY ("collectionId", "spaceId");

-- AddForeignKey
ALTER TABLE "SpaceDashboardCollection" ADD CONSTRAINT "SpaceDashboardCollection_repositoryPattern_fkey" FOREIGN KEY ("repositoryPattern") REFERENCES "Repository"("pattern") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceDashboardCollection" ADD CONSTRAINT "SpaceDashboardCollection_aliasPattern_fkey" FOREIGN KEY ("aliasPattern") REFERENCES "RepositoryAlias"("pattern") ON DELETE SET NULL ON UPDATE CASCADE;
