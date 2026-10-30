/*
  Warnings:

  - You are about to drop the column `addressAr` on the `Patient` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Doctor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "specialtyId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "qualification" TEXT,
    "qualificationAr" TEXT,
    "experienceYears" INTEGER,
    "consultationFee" REAL,
    "workingDays" TEXT,
    "workingHoursStart" TEXT,
    "workingHoursEnd" TEXT,
    "bio" TEXT,
    "bioAr" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Doctor_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Doctor" ("bio", "bioAr", "consultationFee", "createdAt", "email", "experienceYears", "id", "isActive", "licenseNumber", "name", "nameAr", "phone", "qualification", "qualificationAr", "specialtyId", "updatedAt", "workingDays", "workingHoursEnd", "workingHoursStart") SELECT "bio", "bioAr", "consultationFee", "createdAt", "email", "experienceYears", "id", "isActive", "licenseNumber", "name", "nameAr", "phone", "qualification", "qualificationAr", "specialtyId", "updatedAt", "workingDays", "workingHoursEnd", "workingHoursStart" FROM "Doctor";
DROP TABLE "Doctor";
ALTER TABLE "new_Doctor" RENAME TO "Doctor";
CREATE UNIQUE INDEX "Doctor_email_key" ON "Doctor"("email");
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Patient" ("address", "allergies", "bloodType", "createdAt", "dateOfBirth", "email", "emergencyContact", "emergencyPhone", "gender", "id", "insurance", "isActive", "medicalHistory", "name", "nameAr", "nationalId", "patientNumber", "phone", "updatedAt") SELECT "address", "allergies", "bloodType", "createdAt", "dateOfBirth", "email", "emergencyContact", "emergencyPhone", "gender", "id", "insurance", "isActive", "medicalHistory", "name", "nameAr", "nationalId", "patientNumber", "phone", "updatedAt" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE UNIQUE INDEX "Patient_patientNumber_key" ON "Patient"("patientNumber");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "id", "name", "password", "role", "updatedAt", "username") SELECT "createdAt", "id", "name", "password", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
