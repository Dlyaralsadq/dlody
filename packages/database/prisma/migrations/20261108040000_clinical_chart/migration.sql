-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "services" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "announcement" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "feeAmount" REAL;
ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" DATETIME;

-- CreateTable
CREATE TABLE "PatientDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClinicalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientDiagnosis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientDiagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PatientDocument_patientId_doctorId_idx" ON "PatientDocument"("patientId", "doctorId");
CREATE INDEX "ClinicalNote_patientId_doctorId_idx" ON "ClinicalNote"("patientId", "doctorId");
CREATE INDEX "PatientDiagnosis_patientId_doctorId_idx" ON "PatientDiagnosis"("patientId", "doctorId");
