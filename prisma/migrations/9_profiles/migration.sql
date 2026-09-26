-- Profile details per membership.
ALTER TABLE "Membership" ADD COLUMN "managerId" TEXT;
ALTER TABLE "Membership" ADD COLUMN "startDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Membership" ADD COLUMN "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Membership" ADD COLUMN "employmentType" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Membership" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Membership" ADD COLUMN "customValues" TEXT NOT NULL DEFAULT '{}';

-- The organization's own profile fields.
ALTER TABLE "Organization" ADD COLUMN "customFields" TEXT NOT NULL DEFAULT '[]';

-- Saved analytics filters.
CREATE TABLE "AnalyticsView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AnalyticsView_organizationId_userId_idx" ON "AnalyticsView"("organizationId", "userId");
