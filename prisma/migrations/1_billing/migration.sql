-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" TIMESTAMP(3),
    "paddleCustomerId" TEXT,
    "paddleSubscriptionId" TEXT,
    "priceId" TEXT,
    "interval" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAt" TIMESTAMP(3),
    "pastDueSince" TIMESTAMP(3),
    "paddleUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "paddleEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organizationId" TEXT,
    "payload" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paddleSubscriptionId_key" ON "Subscription"("paddleSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_paddleEventId_key" ON "BillingEvent"("paddleEventId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Organizations that existed before billing keep every feature for 90 days: a Business trial.
INSERT INTO "Subscription" ("id", "organizationId", "plan", "status", "trialEndsAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'business', 'trialing', CURRENT_TIMESTAMP + INTERVAL '90 days', CURRENT_TIMESTAMP
FROM "Organization";
