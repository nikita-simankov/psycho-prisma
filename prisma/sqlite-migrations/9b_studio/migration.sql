-- Instrument names are unique per organization's view, checked in the studio actions.
DROP INDEX "Test_name_key";
DROP INDEX "Form_name_key";

-- AlterTable
ALTER TABLE "Test" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Test" ADD COLUMN "draft" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Test" ADD COLUMN "copiedFromId" TEXT;
ALTER TABLE "Form" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Form" ADD COLUMN "draft" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Form" ADD COLUMN "copiedFromId" TEXT;
ALTER TABLE "TestSubmission" ADD COLUMN "testVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "FormSubmission" ADD COLUMN "formVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "InstrumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentVersion_kind_instrumentId_version_key" ON "InstrumentVersion"("kind", "instrumentId", "version");
