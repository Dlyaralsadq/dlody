-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "nationalId" TEXT,
    "bloodType" TEXT,
    "insurance" TEXT,
    "medicalHistory" TEXT,
    "allergies" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "doctorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "treatmentType" TEXT,
    "totalSessions" INTEGER,
    "sessionsCompleted" INTEGER DEFAULT 0,
    "nextVisitDate" DATETIME,
    "recurringWeeks" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Patient" ("address", "allergies", "bloodType", "createdAt", "dateOfBirth", "doctorId", "email", "emergencyContact", "emergencyPhone", "gender", "id", "insurance", "isActive", "medicalHistory", "name", "nameAr", "nationalId", "patientNumber", "phone", "updatedAt") SELECT "address", "allergies", "bloodType", "createdAt", "dateOfBirth", "doctorId", "email", "emergencyContact", "emergencyPhone", "gender", "id", "insurance", "isActive", "medicalHistory", "name", "nameAr", "nationalId", "patientNumber", "phone", "updatedAt" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE UNIQUE INDEX "Patient_patientNumber_key" ON "Patient"("patientNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
