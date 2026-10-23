-- CreateTable
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "sourceDashboardId" TEXT,
    "sourceSpaceId" TEXT,
    "data" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB[],
    "kibanaVersion" TEXT,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collectionId" TEXT,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceDashboardCollection" (
    "collectionId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "repositoryPattern" TEXT NOT NULL,
    "disabledDashboards" TEXT[],
    "importedAt" TIMESTAMP(3),
    "importErrors" JSONB[],

    CONSTRAINT "SpaceDashboardCollection_pkey" PRIMARY KEY ("collectionId","spaceId","repositoryPattern")
);

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DashboardCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceDashboardCollection" ADD CONSTRAINT "SpaceDashboardCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DashboardCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceDashboardCollection" ADD CONSTRAINT "SpaceDashboardCollection_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceDashboardCollection" ADD CONSTRAINT "SpaceDashboardCollection_repositoryPattern_fkey" FOREIGN KEY ("repositoryPattern") REFERENCES "Repository"("pattern") ON DELETE CASCADE ON UPDATE CASCADE;
