-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "retentionMonths" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "candidateRetentionMonths" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "subjectId" TEXT,
    "detail" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_subjectId_idx" ON "AuditEvent"("organizationId", "subjectId");
