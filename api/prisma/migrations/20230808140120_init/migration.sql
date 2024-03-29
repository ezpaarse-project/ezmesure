-- CreateEnum
CREATE TYPE "HarvestJobStatus" AS ENUM ('waiting', 'running', 'delayed', 'finished', 'failed', 'cancelled', 'interrupted');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "parentInstitutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "namespace" TEXT,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "hidePartner" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "logoId" TEXT,
    "type" TEXT,
    "acronym" TEXT,
    "websiteUrl" TEXT,
    "city" TEXT,
    "uai" TEXT,
    "social" JSONB,
    "auto" JSONB,
    "sushiReadySince" TIMESTAMP(3),

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Membership" (
    "username" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "roles" TEXT[],
    "permissions" TEXT[],
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("username","institutionId")
);

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "initials" TEXT,
    "color" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "indexPatterns" JSONB[],

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpacePermission" (
    "username" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SpacePermission_pkey" PRIMARY KEY ("username","spaceId")
);

-- CreateTable
CREATE TABLE "Repository" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pattern" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("pattern")
);

-- CreateTable
CREATE TABLE "RepositoryPermission" (
    "username" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "repositoryPattern" TEXT NOT NULL,
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RepositoryPermission_pkey" PRIMARY KEY ("username","institutionId","repositoryPattern")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "authorId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(50) NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestJob" (
    "id" TEXT NOT NULL,
    "credentialsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "beginDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" "HarvestJobStatus" NOT NULL,
    "reportType" TEXT NOT NULL,
    "harvestId" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "runningTime" INTEGER,
    "timeout" INTEGER NOT NULL,
    "forceDownload" BOOLEAN NOT NULL DEFAULT false,
    "ignoreValidation" BOOLEAN NOT NULL DEFAULT false,
    "params" JSONB DEFAULT '{}',
    "result" JSONB,
    "errorCode" TEXT,
    "sushiExceptions" JSONB[],

    CONSTRAINT "HarvestJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Harvest" (
    "harvestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialsId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "sushiExceptions" JSONB[],
    "insertedItems" INTEGER NOT NULL DEFAULT 0,
    "updatedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Harvest_pkey" PRIMARY KEY ("credentialsId","reportId","period")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "runningTime" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SushiEndpoint" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sushiUrl" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "tags" TEXT[],
    "description" TEXT,
    "counterVersion" TEXT,
    "technicalProvider" TEXT,
    "requireCustomerId" BOOLEAN NOT NULL DEFAULT false,
    "requireRequestorId" BOOLEAN NOT NULL DEFAULT false,
    "requireApiKey" BOOLEAN NOT NULL DEFAULT false,
    "ignoreReportValidation" BOOLEAN NOT NULL DEFAULT false,
    "disabledUntil" TIMESTAMP(3),
    "defaultCustomerId" TEXT,
    "defaultRequestorId" TEXT,
    "defaultApiKey" TEXT,
    "paramSeparator" TEXT,
    "supportedReports" TEXT[],
    "supportedReportsUpdatedAt" TIMESTAMP(3),
    "params" JSONB[],

    CONSTRAINT "SushiEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SushiCredentials" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "customerId" TEXT,
    "requestorId" TEXT,
    "apiKey" TEXT,
    "comment" TEXT,
    "tags" TEXT[],
    "params" JSONB[],
    "connection" JSONB,

    CONSTRAINT "SushiCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InstitutionToRepository" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_InstitutionToRepository_AB_unique" ON "_InstitutionToRepository"("A", "B");

-- CreateIndex
CREATE INDEX "_InstitutionToRepository_B_index" ON "_InstitutionToRepository"("B");

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_parentInstitutionId_fkey" FOREIGN KEY ("parentInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacePermission" ADD CONSTRAINT "SpacePermission_username_institutionId_fkey" FOREIGN KEY ("username", "institutionId") REFERENCES "Membership"("username", "institutionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacePermission" ADD CONSTRAINT "SpacePermission_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryPermission" ADD CONSTRAINT "RepositoryPermission_username_institutionId_fkey" FOREIGN KEY ("username", "institutionId") REFERENCES "Membership"("username", "institutionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryPermission" ADD CONSTRAINT "RepositoryPermission_repositoryPattern_fkey" FOREIGN KEY ("repositoryPattern") REFERENCES "Repository"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestJob" ADD CONSTRAINT "HarvestJob_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "SushiCredentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "SushiCredentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "HarvestJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "HarvestJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SushiCredentials" ADD CONSTRAINT "SushiCredentials_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SushiCredentials" ADD CONSTRAINT "SushiCredentials_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "SushiEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToRepository" ADD CONSTRAINT "_InstitutionToRepository_A_fkey" FOREIGN KEY ("A") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstitutionToRepository" ADD CONSTRAINT "_InstitutionToRepository_B_fkey" FOREIGN KEY ("B") REFERENCES "Repository"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;
