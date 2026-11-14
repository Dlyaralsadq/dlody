-- AlterTable: contact login + verification flags on User
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- Backfill patient phone from username (patients historically logged in with phone-as-username)
UPDATE "User"
SET "phone" = "username"
WHERE "role" = 'patient' AND ("phone" IS NULL OR "phone" = '');

-- Backfill doctor email/phone from Doctor profile when linked
UPDATE "User"
SET "email" = (
  SELECT d."email" FROM "Doctor" d WHERE d."userId" = "User"."id" AND d."email" IS NOT NULL LIMIT 1
)
WHERE "email" IS NULL;

UPDATE "User"
SET "phone" = (
  SELECT d."phone" FROM "Doctor" d WHERE d."userId" = "User"."id" AND d."phone" IS NOT NULL LIMIT 1
)
WHERE ("phone" IS NULL OR "phone" = '');

-- CreateTable
CREATE TABLE "ContactVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContactVerificationToken_userId_purpose_idx" ON "ContactVerificationToken"("userId", "purpose");
