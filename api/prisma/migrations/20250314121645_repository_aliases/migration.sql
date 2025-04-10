-- CreateTable
CREATE TABLE "RepositoryAlias" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pattern" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "filters" JSONB,

    CONSTRAINT "RepositoryAlias_pkey" PRIMARY KEY ("pattern")
);

-- CreateTable
CREATE TABLE "RepositoryAliasPermission" (
    "username" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "aliasPattern" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RepositoryAliasPermission_pkey" PRIMARY KEY ("username","institutionId","aliasPattern")
);

-- CreateTable
CREATE TABLE "_InstitutionToRepositoryAlias" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_InstitutionToRepositoryAlias_AB_unique" ON "_InstitutionToRepositoryAlias"("A", "B");

-- CreateIndex
CREATE INDEX "_InstitutionToRepositoryAlias_B_index" ON "_InstitutionToRepositoryAlias"("B");

-- AddForeignKey
ALTER TABLE "RepositoryAlias" ADD CONSTRAINT "RepositoryAlias_target_fkey" FOREIGN KEY ("target") REFERENCES "Repository"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryAliasPermission" ADD CONSTRAINT "RepositoryAliasPermission_username_institutionId_fkey" FOREIGN KEY ("username", "institutionId") REFERENCES "Membership"("username", "institutionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryAliasPermission" ADD CONSTRAINT "RepositoryAliasPermission_aliasPattern_fkey" FOREIGN KEY ("aliasPattern") REFERENCES "RepositoryAlias"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToRepositoryAlias" ADD CONSTRAINT "_InstitutionToRepositoryAlias_A_fkey" FOREIGN KEY ("A") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToRepositoryAlias" ADD CONSTRAINT "_InstitutionToRepositoryAlias_B_fkey" FOREIGN KEY ("B") REFERENCES "RepositoryAlias"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;
