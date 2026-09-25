-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstTimer" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT NOT NULL,
    "imageURL" TEXT NOT NULL DEFAULT '',
    "group" TEXT NOT NULL DEFAULT 'Общая группа',
    "rank" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL DEFAULT '',
    "recruitedBy" TEXT NOT NULL DEFAULT '',
    "servingKind" TEXT NOT NULL DEFAULT 'Срочная служба',
    "servingPeriod" TEXT NOT NULL DEFAULT '1 период (1-6 месяцев)',
    "recruitmentDate" TEXT NOT NULL DEFAULT '',
    "recoveryQuestionAnswer" TEXT NOT NULL DEFAULT 'Фамилия',
    "city" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "building" TEXT NOT NULL DEFAULT '',
    "appartment" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ttc" INTEGER NOT NULL DEFAULT 5,
    "group" TEXT NOT NULL DEFAULT '',
    "questions" TEXT NOT NULL,
    "adminOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Test" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TestSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "verdict" TEXT NOT NULL,
    "additionalNotes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CategoryToForm" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CategoryToForm_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryToForm_B_fkey" FOREIGN KEY ("B") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CategoryToTest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CategoryToTest_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryToTest_B_fkey" FOREIGN KEY ("B") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Form_name_key" ON "Form"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Test_name_key" ON "Test"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSummary_userId_key" ON "UserSummary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToForm_AB_unique" ON "_CategoryToForm"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToForm_B_index" ON "_CategoryToForm"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToTest_AB_unique" ON "_CategoryToTest"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToTest_B_index" ON "_CategoryToTest"("B");

