/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accountLinked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "id" TEXT NOT NULL DEFAULT concat('ezm:', gen_random_uuid());

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");
