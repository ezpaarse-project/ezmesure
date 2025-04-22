-- CreateTable
CREATE TABLE "ElasticRole" (
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElasticRole_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "ElasticRoleRepositoryPermission" (
    "elasticRoleName" TEXT NOT NULL,
    "repositoryPattern" TEXT NOT NULL,
    "readonly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ElasticRoleRepositoryPermission_pkey" PRIMARY KEY ("elasticRoleName","repositoryPattern")
);

-- CreateTable
CREATE TABLE "ElasticRoleRepositoryAliasPermission" (
    "elasticRoleName" TEXT NOT NULL,
    "aliasPattern" TEXT NOT NULL,

    CONSTRAINT "ElasticRoleRepositoryAliasPermission_pkey" PRIMARY KEY ("elasticRoleName","aliasPattern")
);

-- CreateTable
CREATE TABLE "ElasticRoleSpacePermission" (
    "elasticRoleName" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "readonly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ElasticRoleSpacePermission_pkey" PRIMARY KEY ("elasticRoleName","spaceId")
);

-- CreateTable
CREATE TABLE "_ElasticRoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ElasticRoleToInstitution" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ElasticRoleToUser_AB_unique" ON "_ElasticRoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ElasticRoleToUser_B_index" ON "_ElasticRoleToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ElasticRoleToInstitution_AB_unique" ON "_ElasticRoleToInstitution"("A", "B");

-- CreateIndex
CREATE INDEX "_ElasticRoleToInstitution_B_index" ON "_ElasticRoleToInstitution"("B");

-- AddForeignKey
ALTER TABLE "ElasticRoleRepositoryPermission" ADD CONSTRAINT "ElasticRoleRepositoryPermission_elasticRoleName_fkey" FOREIGN KEY ("elasticRoleName") REFERENCES "ElasticRole"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElasticRoleRepositoryPermission" ADD CONSTRAINT "ElasticRoleRepositoryPermission_repositoryPattern_fkey" FOREIGN KEY ("repositoryPattern") REFERENCES "Repository"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElasticRoleRepositoryAliasPermission" ADD CONSTRAINT "ElasticRoleRepositoryAliasPermission_elasticRoleName_fkey" FOREIGN KEY ("elasticRoleName") REFERENCES "ElasticRole"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElasticRoleRepositoryAliasPermission" ADD CONSTRAINT "ElasticRoleRepositoryAliasPermission_aliasPattern_fkey" FOREIGN KEY ("aliasPattern") REFERENCES "RepositoryAlias"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElasticRoleSpacePermission" ADD CONSTRAINT "ElasticRoleSpacePermission_elasticRoleName_fkey" FOREIGN KEY ("elasticRoleName") REFERENCES "ElasticRole"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElasticRoleSpacePermission" ADD CONSTRAINT "ElasticRoleSpacePermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ElasticRoleToUser" ADD CONSTRAINT "_ElasticRoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "ElasticRole"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ElasticRoleToUser" ADD CONSTRAINT "_ElasticRoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ElasticRoleToInstitution" ADD CONSTRAINT "_ElasticRoleToInstitution_A_fkey" FOREIGN KEY ("A") REFERENCES "ElasticRole"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ElasticRoleToInstitution" ADD CONSTRAINT "_ElasticRoleToInstitution_B_fkey" FOREIGN KEY ("B") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
