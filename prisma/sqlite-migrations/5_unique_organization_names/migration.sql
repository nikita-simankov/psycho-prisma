-- Organization names become unique regardless of case. Existing duplicates keep the
-- oldest organization's name; later ones get " (2)", " (3)" and so on.
CREATE TEMP TABLE "organization_rank" AS
SELECT "id", (
  SELECT COUNT(*) FROM "Organization" AS "earlier"
  WHERE lower(trim("earlier"."name")) = lower(trim("Organization"."name"))
    AND ("earlier"."createdAt" < "Organization"."createdAt"
      OR ("earlier"."createdAt" = "Organization"."createdAt" AND "earlier"."id" < "Organization"."id"))
) + 1 AS "rank"
FROM "Organization";

UPDATE "Organization"
SET "name" = trim("name") || ' (' || (SELECT "rank" FROM "organization_rank" WHERE "organization_rank"."id" = "Organization"."id") || ')'
WHERE (SELECT "rank" FROM "organization_rank" WHERE "organization_rank"."id" = "Organization"."id") > 1;

DROP TABLE "organization_rank";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "respondentFeedback" BOOLEAN NOT NULL DEFAULT false,
    "privacyContact" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- SQLite's lower() only folds ASCII; the seed recomputes keys for other scripts.
INSERT INTO "new_Organization" ("createdAt", "id", "name", "nameKey", "privacyContact", "respondentFeedback", "slug", "updatedAt") SELECT "createdAt", "id", "name", lower(trim("name")), "privacyContact", "respondentFeedback", "slug", "updatedAt" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_nameKey_key" ON "Organization"("nameKey");
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
