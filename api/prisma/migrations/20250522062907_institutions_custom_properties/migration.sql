-- CreateTable
CREATE TABLE "InstitutionProperty" (
    "fieldId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value" JSONB,

    CONSTRAINT "InstitutionProperty_pkey" PRIMARY KEY ("fieldId","institutionId")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "multiple" BOOLEAN NOT NULL DEFAULT false,
    "editable" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "labelFr" TEXT,
    "labelEn" TEXT,
    "descriptionFr" TEXT,
    "descriptionEn" TEXT,
    "helpUrl" TEXT,
    "itemUrl" TEXT,
    "autocomplete" JSONB,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InstitutionProperty" ADD CONSTRAINT "InstitutionProperty_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionProperty" ADD CONSTRAINT "InstitutionProperty_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
