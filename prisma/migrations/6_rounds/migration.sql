-- AlterTable
ALTER TABLE "FormSubmission" ADD COLUMN "assignmentId" TEXT;

-- AlterTable
ALTER TABLE "TestSubmission" ADD COLUMN "assignmentId" TEXT;

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "items" TEXT NOT NULL,
    "dueAt" DATETIME,
    "closedAt" DATETIME,
    "scheduleId" TEXT,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Round_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Round_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RoundSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "tokenHash" TEXT,
    "tokenExpiresAt" DATETIME,
    "invitedAt" DATETIME,
    "remindedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoundSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "items" TEXT NOT NULL,
    "intervalMonths" INTEGER NOT NULL,
    "dueDays" INTEGER NOT NULL DEFAULT 14,
    "teamIds" TEXT NOT NULL DEFAULT '[]',
    "userIds" TEXT NOT NULL DEFAULT '[]',
    "nextRunAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoundSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "retestDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Test" ("createdAt", "description", "id", "instruction", "name", "organizationId", "questions", "scales", "sensitive", "stanTable", "strategy", "summaryTable", "tGradeTable", "translations", "ttc", "updatedAt") SELECT "createdAt", "description", "id", "instruction", "name", "organizationId", "questions", "scales", "sensitive", "stanTable", "strategy", "summaryTable", "tGradeTable", "translations", "ttc", "updatedAt" FROM "Test";
DROP TABLE "Test";
ALTER TABLE "new_Test" RENAME TO "Test";
CREATE UNIQUE INDEX "Test_name_key" ON "Test"("name");
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
    "locale" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "dateOfBirth", "email", "firstTimer", "id", "imageURL", "lastName", "middleName", "name", "password", "phoneNumber", "updatedAt") SELECT "createdAt", "dateOfBirth", "email", "firstTimer", "id", "imageURL", "lastName", "middleName", "name", "password", "phoneNumber", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_tokenHash_key" ON "Assignment"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_roundId_userId_key" ON "Assignment"("roundId", "userId");
