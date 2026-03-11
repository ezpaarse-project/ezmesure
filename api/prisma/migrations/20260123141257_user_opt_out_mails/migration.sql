-- AlterTable
ALTER TABLE "User" ADD COLUMN     "excludeNotifications" TEXT[] DEFAULT ARRAY[]::TEXT[];
