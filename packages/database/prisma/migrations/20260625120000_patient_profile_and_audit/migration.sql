-- AlterTable
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "dateOfBirth" DATETIME;
ALTER TABLE "User" ADD COLUMN "bloodType" TEXT;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "customTreatmentTypes" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "patientAge" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "patientGender" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "patientBloodType" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "bookedForName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "bookingForSelf" BOOLEAN DEFAULT true;
ALTER TABLE "Appointment" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "deletedByRole" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "deleteNote" TEXT;
