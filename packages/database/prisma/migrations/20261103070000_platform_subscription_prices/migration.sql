-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "monthlyPrice" INTEGER NOT NULL DEFAULT 50000,
    "yearlyPrice" INTEGER NOT NULL DEFAULT 480000,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "PlatformSettings" ("id", "monthlyPrice", "yearlyPrice", "updatedAt")
VALUES ('default', 50000, 480000, CURRENT_TIMESTAMP);
