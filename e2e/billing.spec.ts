import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { ORG } from "./fixtures";

// Plans and Paddle billing, without Paddle: webhooks are signed here with the secret the test
// server runs with (playwright.config.ts), and the plan is set directly to check what it unlocks.

const SECRET = "e2e-paddle-secret";
const prisma = new PrismaClient();

test.use({ storageState: "e2e/.auth/owner.json" });
test.describe.configure({ mode: "serial" });

async function organizationId() {
  return (await prisma.organization.findUniqueOrThrow({ where: { slug: ORG }, select: { id: true } })).id;
}

function signed(body: string) {
  const ts = Math.floor(Date.now() / 1000);
  return { "paddle-signature": `ts=${ts};h1=${createHmac("sha256", SECRET).update(`${ts}:${body}`).digest("hex")}`, "content-type": "application/json" };
}

function subscriptionEvent(orgId: string, eventId: string, priceId: string, updatedAt = new Date().toISOString()) {
  return JSON.stringify({
    event_id: eventId,
    event_type: "subscription.created",
    occurred_at: updatedAt,
    data: {
      id: "sub_e2e",
      status: "active",
      customer_id: "ctm_e2e",
      updated_at: updatedAt,
      custom_data: { organizationId: orgId },
      items: [{ price: { id: priceId, billing_cycle: { interval: "year", frequency: 1 } } }],
      current_billing_period: { starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 365 * 86_400_000).toISOString() },
      scheduled_change: null,
    },
  });
}

test.afterAll(async () => {
  // Back to the trial every other spec expects.
  await prisma.subscription.deleteMany({ where: { organizationId: await organizationId() } });
  await prisma.billingEvent.deleteMany({});
  await prisma.$disconnect();
});

test("a new workspace is on a Business trial", async ({ page }) => {
  await page.goto(`/${ORG}/settings/billing`);
  await expect(page.getByText(/Business trial, 1[34] days left/)).toBeVisible();
  await expect(page.getByText("Checkout isn't set up on this server yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose Team" })).toBeDisabled();
});

test("the webhook refuses unsigned or forged requests", async ({ request }) => {
  const body = subscriptionEvent(await organizationId(), `evt_${randomUUID()}`, "pri_e2e_team");
  expect((await request.post("/api/paddle/webhook", { data: body, headers: { "content-type": "application/json" } })).status()).toBe(401);
  const forged = { ...signed(body), "paddle-signature": signed(body)["paddle-signature"].replace(/h1=./, "h1=0") };
  expect((await request.post("/api/paddle/webhook", { data: body, headers: forged })).status()).toBe(401);
});

test("a signed subscription event changes the plan, once", async ({ page, request }) => {
  const eventId = `evt_${randomUUID()}`;
  const body = subscriptionEvent(await organizationId(), eventId, "pri_e2e_team");

  const first = await request.post("/api/paddle/webhook", { data: body, headers: signed(body) });
  expect(await first.json()).toEqual({ outcome: "applied" });
  const again = await request.post("/api/paddle/webhook", { data: body, headers: signed(body) });
  expect(await again.json()).toEqual({ outcome: "duplicate" });

  await page.goto(`/${ORG}/settings/billing`);
  await expect(page.getByText(/^Renews on/)).toBeVisible();
  await expect(page.getByText("Your current plan")).toBeVisible();
  await expect(page.getByText("Open invoices and payment details")).toBeVisible();
});

test("an older event arriving late doesn't undo a newer one", async ({ request }) => {
  const orgId = await organizationId();
  const body = subscriptionEvent(orgId, `evt_${randomUUID()}`, "pri_e2e_business", "2020-01-01T00:00:00Z");
  await request.post("/api/paddle/webhook", { data: body, headers: signed(body) });
  expect((await prisma.subscription.findUniqueOrThrow({ where: { organizationId: orgId } })).plan).toBe("team");
});

test("a lower plan locks what it doesn't include and keeps the data", async ({ page }) => {
  // On Team: analytics without saved views, no audit log, no clinical rounds.
  await page.goto(`/${ORG}/analytics`);
  await expect(page.getByRole("heading", { name: "Analytics", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save view/i })).toHaveCount(0);
  await page.goto(`/${ORG}/settings/audit`);
  await expect(page.getByText("This is included from the Business plan.", { exact: false })).toBeVisible();

  // A trial that has ended drops to Free: no analytics at all, and the owner is told why.
  await prisma.subscription.update({
    where: { organizationId: await organizationId() },
    data: { status: "trialing", plan: "business", trialEndsAt: new Date(Date.now() - 86_400_000), paddleSubscriptionId: null, paddleCustomerId: null },
  });
  await page.goto(`/${ORG}/analytics`);
  await expect(page.getByText("Team analytics and saved views")).toBeVisible();
  await expect(page.getByRole("link", { name: "See plans" })).toBeVisible();
  await expect(page.getByText("Your trial has ended and you're on Free.")).toBeVisible();

  // Existing people and results are all still there.
  await page.goto(`/${ORG}/people`);
  await expect(page.getByRole("table")).toBeVisible();
});
