/*
  Warnings:

  - You are about to drop the column `counterVersion` on the `SushiEndpoint` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SushiEndpoint" DROP COLUMN "counterVersion",
ADD COLUMN     "counterVersions" TEXT[] DEFAULT ARRAY['5']::TEXT[],
ADD COLUMN     "registryId" TEXT;
