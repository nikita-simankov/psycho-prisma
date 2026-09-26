-- DropIndex
DROP INDEX "Organization_nameKey_key";

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "held" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "welcomedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "goal" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isSample" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "setupDismissedAt" TIMESTAMP(3),
ADD COLUMN     "teamSize" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Organization_nameKey_idx" ON "Organization"("nameKey");


-- People who were already here don't need the welcome card.
UPDATE "Membership" SET "welcomedAt" = CURRENT_TIMESTAMP;
