-- AlterTable
ALTER TABLE "Form" ADD COLUMN "organizationId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "respondentFeedback" BOOLEAN NOT NULL DEFAULT false,
    "privacyContact" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "teamId" TEXT,
    "position" TEXT NOT NULL DEFAULT '',
    "flag" TEXT NOT NULL DEFAULT '',
    "consentedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Membership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'member',
    "position" TEXT NOT NULL DEFAULT '',
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT,
    "invitedById" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);


-- Existing installs: move everyone into one default organization.
INSERT INTO "Organization" ("id", "name", "slug", "updatedAt")
SELECT 'default-org', 'My organization', 'default', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "User");

-- Departments become teams.
INSERT INTO "Team" ("id", "name", "organizationId")
SELECT lower(hex(randomblob(16))), "department", 'default-org'
FROM (SELECT DISTINCT trim("department") AS "department" FROM "User" WHERE trim("department") <> '');

-- Admins reviewed results in the old app, so they become psychologists; the earliest admin owns the organization.
-- Old risk groups become the restricted follow-up flag.
INSERT INTO "Membership" ("id", "userId", "organizationId", "role", "teamId", "position", "flag", "consentedAt", "createdAt", "updatedAt")
SELECT
  lower(hex(randomblob(16))),
  u."id",
  'default-org',
  CASE WHEN u."role" = 'admin' THEN 'psychologist' ELSE 'member' END,
  (SELECT t."id" FROM "Team" t WHERE t."organizationId" = 'default-org' AND t."name" = trim(u."department")),
  u."position",
  CASE WHEN u."group" IN ('monitoring', 'risk', 'suicide-risk', 'substance-risk') THEN u."group" ELSE '' END,
  u."consentedAt",
  u."createdAt",
  CURRENT_TIMESTAMP
FROM "User" u;

UPDATE "Membership" SET "role" = 'owner'
WHERE "id" = (
  SELECT m."id" FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
  WHERE m."role" = 'psychologist' ORDER BY u."createdAt" LIMIT 1
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FormSubmission" ("createdAt", "formId", "id", "submission", "updatedAt", "userId", "organizationId") SELECT "createdAt", "formId", "id", "submission", "updatedAt", "userId", 'default-org' FROM "FormSubmission";
DROP TABLE "FormSubmission";
ALTER TABLE "new_FormSubmission" RENAME TO "FormSubmission";
CREATE TABLE "new_Test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ttc" INTEGER NOT NULL DEFAULT 5,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "instruction" TEXT NOT NULL DEFAULT '',
    "scales" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "stanTable" TEXT NOT NULL,
    "tGradeTable" TEXT NOT NULL,
    "summaryTable" TEXT NOT NULL,
    "translations" TEXT NOT NULL DEFAULT '{}',
    "organizationId" TEXT,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Test" ("createdAt", "description", "id", "instruction", "name", "questions", "scales", "stanTable", "strategy", "summaryTable", "tGradeTable", "translations", "ttc", "updatedAt") SELECT "createdAt", "description", "id", "instruction", "name", "questions", "scales", "stanTable", "strategy", "summaryTable", "tGradeTable", "translations", "ttc", "updatedAt" FROM "Test";
DROP TABLE "Test";
ALTER TABLE "new_Test" RENAME TO "Test";
CREATE UNIQUE INDEX "Test_name_key" ON "Test"("name");
CREATE TABLE "new_TestSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TestSubmission" ("createdAt", "id", "submission", "summary", "testId", "updatedAt", "userId", "organizationId") SELECT "createdAt", "id", "submission", "summary", "testId", "updatedAt", "userId", 'default-org' FROM "TestSubmission";
DROP TABLE "TestSubmission";
ALTER TABLE "new_TestSubmission" RENAME TO "TestSubmission";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "middleName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "imageURL" TEXT NOT NULL DEFAULT '',
    "dateOfBirth" TEXT NOT NULL DEFAULT '',
    "firstTimer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "dateOfBirth", "firstTimer", "id", "imageURL", "lastName", "middleName", "name", "password", "phoneNumber", "updatedAt") SELECT "createdAt", "dateOfBirth", "firstTimer", "id", "imageURL", "lastName", "middleName", "name", "password", "phoneNumber", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
CREATE TABLE "new_UserSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "verdict" TEXT NOT NULL,
    "additionalNotes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSummary" ("additionalNotes", "createdAt", "id", "updatedAt", "userId", "verdict", "organizationId") SELECT "additionalNotes", "createdAt", "id", "updatedAt", "userId", "verdict", 'default-org' FROM "UserSummary";
DROP TABLE "UserSummary";
ALTER TABLE "new_UserSummary" RENAME TO "UserSummary";
CREATE UNIQUE INDEX "UserSummary_userId_organizationId_key" ON "UserSummary"("userId", "organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_organizationId_name_key" ON "Team"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

