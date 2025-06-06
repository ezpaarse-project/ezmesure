-- AlterTable
ALTER TABLE "RepositoryAlias" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "RepositoryAliasTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pattern" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "filters" JSONB[],
    "conditions" JSONB[],

    CONSTRAINT "RepositoryAliasTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RepositoryAlias" ADD CONSTRAINT "RepositoryAlias_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RepositoryAliasTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryAliasTemplate" ADD CONSTRAINT "RepositoryAliasTemplate_target_fkey" FOREIGN KEY ("target") REFERENCES "Repository"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;
