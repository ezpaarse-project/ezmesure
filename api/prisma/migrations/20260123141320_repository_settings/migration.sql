-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';
