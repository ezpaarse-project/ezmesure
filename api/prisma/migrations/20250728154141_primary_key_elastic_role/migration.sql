-- AlterTable
ALTER TABLE "_ElasticRoleToInstitution" ADD CONSTRAINT "_ElasticRoleToInstitution_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ElasticRoleToInstitution_AB_unique";

-- AlterTable
ALTER TABLE "_ElasticRoleToUser" ADD CONSTRAINT "_ElasticRoleToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ElasticRoleToUser_AB_unique";

-- AlterTable
ALTER TABLE "_InstitutionToRepository" ADD CONSTRAINT "_InstitutionToRepository_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_InstitutionToRepository_AB_unique";

-- AlterTable
ALTER TABLE "_InstitutionToRepositoryAlias" ADD CONSTRAINT "_InstitutionToRepositoryAlias_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_InstitutionToRepositoryAlias_AB_unique";
