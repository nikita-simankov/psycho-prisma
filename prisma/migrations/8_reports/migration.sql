-- Saved, numbered copies of a person's report.
CREATE TABLE "ReportVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "background" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "submissionIds" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ReportVersion_organizationId_userId_idx" ON "ReportVersion"("organizationId", "userId");
CREATE UNIQUE INDEX "ReportVersion_organizationId_userId_version_key" ON "ReportVersion"("organizationId", "userId", "version");

-- Conclusions archived before versions existed become version 1, dated when they were last saved.
INSERT INTO "ReportVersion" ("id", "organizationId", "userId", "version", "background", "conclusion", "submissionIds", "createdById", "createdAt")
SELECT lower(hex(randomblob(16))), "organizationId", "userId", 1, "additionalNotes", "verdict", '[]', '', "updatedAt"
FROM "UserSummary" WHERE "userId" IS NOT NULL;

ALTER TABLE "Organization" ADD COLUMN "feedbackTestIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "TestSubmission" ADD COLUMN "locale" TEXT NOT NULL DEFAULT '';
