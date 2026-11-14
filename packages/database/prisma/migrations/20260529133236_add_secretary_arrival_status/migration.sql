-- AlterTable
ALTER TABLE "User" ADD COLUMN "linkedDoctorId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "type" TEXT NOT NULL DEFAULT 'consultation',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "arrivalStatus" TEXT NOT NULL DEFAULT 'pending',
    "queueNumber" INTEGER,
    "reason" TEXT,
    "notes" TEXT,
    "diagnosis" TEXT,
    "prescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("appointmentNumber", "createdAt", "date", "doctorId", "duration", "id", "notes", "patientId", "reason", "status", "type", "updatedAt") SELECT "appointmentNumber", "createdAt", "date", "doctorId", "duration", "id", "notes", "patientId", "reason", "status", "type", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE UNIQUE INDEX "Appointment_appointmentNumber_key" ON "Appointment"("appointmentNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
