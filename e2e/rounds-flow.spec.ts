import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser } from "@playwright/test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ANALOGIES } from "./fixtures";

// The round composer, calendar and respondent journey, in their own organization.

const prisma = new PrismaClient();
const PORT_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const SLUG = "rounds-flow-e2e";
let organizationId = "";
let ownerId = "";
let memberId = "";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

async function signedIn(browser: Browser, userId: string) {
  const sessionId = randomBytes(20).toString("hex");
  await prisma.session.create({ data: { id: sessionId, userId, expiresAt: new Date(Date.now() + 86_400_000) } });
  const context = await browser.newContext();
  await context.addCookies([{ name: "auth_cookie", value: sessionId, url: PORT_URL }]);
  return context.newPage();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  organizationId = (await prisma.organization.create({ data: { name: "Rounds Flow", nameKey: "rounds flow", slug: SLUG } })).id;
  ownerId = (
    await prisma.user.create({
      data: { id: randomUUID(), email: "owner@rounds-flow.test", name: "Rhea", lastName: "Owner", password: "unused", emailVerifiedAt: new Date() },
    })
  ).id;
  memberId = (
    await prisma.user.create({
      data: { id: randomUUID(), email: "mia@rounds-flow.test", name: "Mia", lastName: "Member", password: "unused", emailVerifiedAt: new Date() },
    })
  ).id;
  await prisma.membership.create({ data: { userId: ownerId, organizationId, role: "owner", consentedAt: new Date() } });
  // Not yet agreed to the privacy notice.
  await prisma.membership.create({ data: { userId: memberId, organizationId, role: "member" } });
});

test.afterAll(async () => {
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@rounds-flow.test" } } });
  await prisma.$disconnect();
});

test("the composer keeps a draft that can be reopened and deleted", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/rounds/new`);
  await page.getByLabel("Name", { exact: true }).fill("Draft check-in");
  await expect(page.getByText("Draft saved")).toBeVisible();
  await expect.poll(() => prisma.roundDraft.count({ where: { organizationId } })).toBe(1);

  await page.goto(`/${SLUG}/rounds`);
  await page.getByRole("link", { name: /Draft check-in/ }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Draft check-in");

  await page.goto(`/${SLUG}/rounds`);
  await page.getByRole("button", { name: "Delete the draft Draft check-in" }).click();
  await expect.poll(() => prisma.roundDraft.count({ where: { organizationId } })).toBe(0);
  await expect(page.getByText("Rounds you started but haven't sent.")).toHaveCount(0);
});

test("dragging a round on the calendar moves its due date", async ({ browser }) => {
  const due = new Date();
  due.setDate(due.getDate() + 1);
  due.setHours(23, 59, 0, 0);
  const round = await prisma.round.create({
    data: {
      organizationId,
      name: "Calendar round",
      purpose: "development",
      items: JSON.stringify([{ kind: "test", id: ANALOGIES }]),
      dueAt: due,
      createdById: ownerId,
    },
  });
  const target = new Date(due);
  target.setDate(target.getDate() + 2);

  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/rounds?view=calendar`);
  if (target.getMonth() !== new Date().getMonth()) await page.getByRole("button", { name: "Next month" }).click();
  if (due.getMonth() !== target.getMonth()) await page.getByRole("button", { name: "Previous month" }).click();
  const chip = page.getByRole("link", { name: "Calendar round" });
  await expect(chip).toBeVisible();
  // The same events a browser fires for a drag, with one shared DataTransfer.
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  const cell = page.locator(`[data-day="${dayKey(target)}"]`);
  await chip.dispatchEvent("dragstart", { dataTransfer: transfer });
  await cell.dispatchEvent("dragover", { dataTransfer: transfer });
  await cell.dispatchEvent("drop", { dataTransfer: transfer });
  await expect.poll(async () => dayKey((await prisma.round.findUniqueOrThrow({ where: { id: round.id } })).dueAt!)).toBe(dayKey(target));
  await expect(page.getByText(/Calendar round is now due/).first()).toBeVisible();

  await page.goto(`/${SLUG}/rounds`);
  await expect(page.getByText("On track").first()).toBeVisible();
  await prisma.round.delete({ where: { id: round.id } });
});

test("a round link goes through the privacy notice straight to the first item", async ({ browser }) => {
  const form = await prisma.form.findFirstOrThrow({ where: { organizationId: null, adminOnly: false } });
  const round = await prisma.round.create({
    data: {
      organizationId,
      name: "Two-part round",
      purpose: "development",
      items: JSON.stringify([
        { kind: "form", id: form.id },
        { kind: "test", id: ANALOGIES },
      ]),
      createdById: ownerId,
    },
  });
  const token = randomBytes(32).toString("base64url");
  const assignment = await prisma.assignment.create({
    data: {
      roundId: round.id,
      userId: memberId,
      items: round.items,
      invitedAt: new Date(),
      tokenHash: hash(token),
      tokenExpiresAt: new Date(Date.now() + 86_400_000),
    },
  });

  const page = await (await browser.newContext()).newPage();
  await page.goto(`/r/${token}`);
  await expect(page).toHaveURL(/\/consent\?next=/);
  await expect(page.getByRole("heading", { name: "What happens with your answers" })).toBeVisible();
  await expect(page.getByText("groups of 5 or more")).toBeVisible();
  await page.getByRole("button", { name: "I agree" }).click();

  await expect(page).toHaveURL(new RegExp(`/forms/${form.id}\\?assignment=${assignment.id}`));
  await expect(page.getByText("Two-part round · 1 of 2")).toBeVisible();
  await prisma.round.delete({ where: { id: round.id } });
});

test("an expired link can be replaced by email without saying who has an account", async ({ page }) => {
  await page.goto("/link-expired");
  await page.getByLabel("Your email").fill("nobody@rounds-flow.test");
  await page.getByRole("button", { name: "Email me a new link" }).click();
  await expect(page.getByText("If that address has anything open")).toBeVisible();
});

test("quiet hours are set in the organization settings", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/settings`);
  await page.getByRole("switch", { name: "Quiet hours" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect.poll(async () => (await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).quietHours).toBe(true);
});

test("a person's page opens the composer with them chosen", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/people/${memberId}`);
  await page.getByRole("link", { name: "Send in a round" }).click();
  await expect(page).toHaveURL(new RegExp(`/rounds/new\\?person=${memberId}`));
  await page.getByLabel("Name", { exact: true }).fill("For Mia");
  await page.getByLabel("Search tests and questionnaires").fill("Hobbies");
  await page.getByLabel(/Hobbies/).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("checkbox", { name: /Mia/ })).toBeChecked();
});
