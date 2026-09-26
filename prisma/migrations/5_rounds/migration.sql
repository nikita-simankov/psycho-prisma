-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "sendAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "quietHours" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "RoundSchedule" ADD COLUMN     "offsetDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trigger" TEXT NOT NULL DEFAULT 'interval';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "LifecycleSent" (
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleSent_pkey" PRIMARY KEY ("scheduleId","userId","cycle")
);

-- CreateTable
CREATE TABLE "RoundDraft" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoundDraft_organizationId_idx" ON "RoundDraft"("organizationId");

-- AddForeignKey
ALTER TABLE "LifecycleSent" ADD CONSTRAINT "LifecycleSent_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RoundSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundDraft" ADD CONSTRAINT "RoundDraft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

