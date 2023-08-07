-- CreateTable
CREATE TABLE "Harvest" (
    "harvestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialsId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "insertedItems" INTEGER NOT NULL DEFAULT 0,
    "updatedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Harvest_pkey" PRIMARY KEY ("credentialsId","reportId","period")
);

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "SushiCredentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
