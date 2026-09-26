-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "timings" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "assignmentId" TEXT,
    "timings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FormSubmission" ("assignmentId", "createdAt", "formId", "id", "organizationId", "submission", "updatedAt", "userId") SELECT "assignmentId", "createdAt", "formId", "id", "organizationId", "submission", "updatedAt", "userId" FROM "FormSubmission";
DROP TABLE "FormSubmission";
ALTER TABLE "new_FormSubmission" RENAME TO "FormSubmission";
CREATE TABLE "new_TestSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "assignmentId" TEXT,
    "timings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TestSubmission" ("assignmentId", "createdAt", "id", "organizationId", "submission", "summary", "testId", "updatedAt", "userId") SELECT "assignmentId", "createdAt", "id", "organizationId", "submission", "summary", "testId", "updatedAt", "userId" FROM "TestSubmission";
DROP TABLE "TestSubmission";
ALTER TABLE "new_TestSubmission" RENAME TO "TestSubmission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Draft_userId_organizationId_kind_instrumentId_key" ON "Draft"("userId", "organizationId", "kind", "instrumentId");
