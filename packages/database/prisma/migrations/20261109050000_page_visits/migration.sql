-- CreateTable
CREATE TABLE "PlatformVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorPageView" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "viewerId" TEXT,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorPageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformVisit_userId_createdAt_idx" ON "PlatformVisit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DoctorPageView_doctorId_kind_idx" ON "DoctorPageView"("doctorId", "kind");

-- CreateIndex
CREATE INDEX "DoctorPageView_viewerId_doctorId_kind_createdAt_idx" ON "DoctorPageView"("viewerId", "doctorId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "PlatformVisit" ADD CONSTRAINT "PlatformVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPageView" ADD CONSTRAINT "DoctorPageView_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPageView" ADD CONSTRAINT "DoctorPageView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
