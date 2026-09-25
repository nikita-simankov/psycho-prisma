-- Replace military profile fields with HR ones.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "middleName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstTimer" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT NOT NULL,
    "imageURL" TEXT NOT NULL DEFAULT '',
    "group" TEXT NOT NULL DEFAULT 'general',
    "department" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "dateOfBirth" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- Carry profile data over: patronymic -> middleName, unit -> department, rank -> position,
-- and Russian group names -> stable keys. Military service and home address columns are dropped.
INSERT INTO "new_User" ("createdAt", "dateOfBirth", "firstTimer", "group", "id", "imageURL", "lastName", "name", "middleName", "department", "position", "password", "phoneNumber", "role", "updatedAt")
SELECT "createdAt", "dateOfBirth", "firstTimer",
    CASE "group"
        WHEN 'Общая группа' THEN 'general'
        WHEN 'Группа риска' THEN 'risk'
        WHEN 'Группа риска наркотизации' THEN 'substance-risk'
        WHEN 'Группа суицидального риска' THEN 'suicide-risk'
        WHEN 'Группа динамического риска' THEN 'monitoring'
        ELSE 'general'
    END,
    "id", "imageURL", "lastName", "name", "surname", "division", "rank", "password", "phoneNumber", "role", "updatedAt"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

