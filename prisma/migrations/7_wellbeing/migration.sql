-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "digestEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "digestSentAt" TIMESTAMP(3),
ADD COLUMN     "digestWeekday" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "supportContacts" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportLinks" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "supportText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "wellbeingRules" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "anonymous" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RoundSchedule" ADD COLUMN     "anonymous" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PulseResponse" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "teamId" TEXT,
    "testId" TEXT NOT NULL,
    "testVersion" INTEGER NOT NULL DEFAULT 1,
    "summary" TEXT NOT NULL,
    "submission" TEXT NOT NULL,

    CONSTRAINT "PulseResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PulseReceipt" (
    "assignmentId" TEXT NOT NULL,
    "item" TEXT NOT NULL,

    CONSTRAINT "PulseReceipt_pkey" PRIMARY KEY ("assignmentId","item")
);

-- CreateTable
CREATE TABLE "WellbeingAlert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "scaleId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "kind" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "previous" DOUBLE PRECISION,
    "limit" DOUBLE PRECISION NOT NULL,
    "people" INTEGER NOT NULL,
    "emailedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WellbeingAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamAction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roundId" TEXT,
    "teamId" TEXT,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareFlag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PulseResponse_roundId_idx" ON "PulseResponse"("roundId");

-- CreateIndex
CREATE INDEX "WellbeingAlert_organizationId_resolvedAt_idx" ON "WellbeingAlert"("organizationId", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WellbeingAlert_roundId_teamId_ruleId_kind_key" ON "WellbeingAlert"("roundId", "teamId", "ruleId", "kind");

-- CreateIndex
CREATE INDEX "TeamAction_organizationId_teamId_idx" ON "TeamAction"("organizationId", "teamId");

-- CreateIndex
CREATE INDEX "CareFlag_organizationId_resolvedAt_idx" ON "CareFlag"("organizationId", "resolvedAt");

-- CreateIndex
CREATE INDEX "CareFlag_organizationId_userId_idx" ON "CareFlag"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "PulseResponse" ADD CONSTRAINT "PulseResponse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulseResponse" ADD CONSTRAINT "PulseResponse_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulseReceipt" ADD CONSTRAINT "PulseReceipt_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingAlert" ADD CONSTRAINT "WellbeingAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingAlert" ADD CONSTRAINT "WellbeingAlert_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingAlert" ADD CONSTRAINT "WellbeingAlert_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAction" ADD CONSTRAINT "TeamAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAction" ADD CONSTRAINT "TeamAction_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAction" ADD CONSTRAINT "TeamAction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareFlag" ADD CONSTRAINT "CareFlag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareFlag" ADD CONSTRAINT "CareFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

