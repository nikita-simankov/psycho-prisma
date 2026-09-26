import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser } from "@playwright/test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ANALOGIES } from "./fixtures";

// First run, invitations and joining. Everything runs in its own organizations with its own
// people, and sessions are created directly so the shared sign-ins stay untouched.

const prisma = new PrismaClient();
const PORT_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const SLUG = "onboarding-e2e";
let organizationId = "";
let ownerId = "";
const createdUsers: string[] = [];
const createdOrganizations: string[] = [];

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

async function createUser(email: string, name: string) {
  const user = await prisma.user.create({
    data: { id: randomUUID(), email, name, lastName: "Onboard", password: "unused", emailVerifiedAt: new Date() },
  });
  createdUsers.push(user.id);
  return user.id;
}

async function signedIn(browser: Browser, userId: string) {
  const sessionId = randomBytes(20).toString("hex");
  await prisma.session.create({ data: { id: sessionId, userId, expiresAt: new Date(Date.now() + 86_400_000) } });
  const context = await browser.newContext();
  await context.addCookies([{ name: "auth_cookie", value: sessionId, url: PORT_URL }]);
  return context.newPage();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  organizationId = (await prisma.organization.create({ data: { name: "Onboarding E2E", nameKey: "onboarding e2e", slug: SLUG } })).id;
  createdOrganizations.push(organizationId);
  ownerId = await createUser("owner@onboarding.test", "Olga");
  await prisma.membership.create({ data: { userId: ownerId, organizationId, role: "owner", consentedAt: new Date() } });
});

test.afterAll(async () => {
  await prisma.organization.deleteMany({ where: { id: { in: createdOrganizations } } });
  await prisma.user.deleteMany({
    where: { OR: [{ id: { in: createdUsers } }, { email: { endsWith: "@onboarding.test" } }] },
  });
  await prisma.$disconnect();
});

test("the welcome steps lead to a sample workspace that can be deleted", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto("/start");
  await expect(page.getByRole("heading", { name: "Welcome, Olga" })).toBeVisible();

  await page.getByText("Hiring", { exact: true }).click();
  await expect(page.getByText("Suggested to start with")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Invite your colleagues" })).toBeVisible();
  expect((await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).goal).toBe("hiring");

  await page.getByRole("button", { name: "I'll do this later" }).click();
  await page.getByRole("button", { name: /Explore the sample workspace/ }).click();
  await expect(page.getByText("This is a sample workspace with fictional people")).toBeVisible({ timeout: 30_000 });
  const sample = await prisma.organization.findFirstOrThrow({ where: { isSample: true, memberships: { some: { userId: ownerId } } } });
  createdOrganizations.push(sample.id);
  expect(await prisma.membership.count({ where: { organizationId: sample.id } })).toBeGreaterThan(40);

  await page.getByRole("button", { name: "Delete the sample" }).click();
  await page.getByRole("button", { name: "Delete the sample" }).click();
  await expect(page).toHaveURL(new RegExp(`/${SLUG}$`));
  await expect.poll(() => prisma.organization.count({ where: { id: sample.id } })).toBe(0);
  expect(await prisma.user.count({ where: { email: { endsWith: "@sample.calibre.invalid" } } })).toBe(0);
});

test("the home page shows the setup checklist until it is hidden", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}`);
  const checklist = page.getByRole("region", { name: /Get Calibre ready/ });
  await expect(checklist).toBeVisible();
  await expect(checklist.getByRole("listitem").filter({ hasText: "Confirm your email" })).toContainText("(done)");
  await page.getByRole("button", { name: "Hide the setup checklist" }).click();
  await expect(checklist).toHaveCount(0);
  await expect
    .poll(async () => (await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).setupDismissedAt)
    .not.toBeNull();
});

test("the invite panel takes several addresses and lists them as pending", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/people`);
  await page.getByRole("button", { name: "Invite people" }).first().click();

  const field = page.getByLabel("Email", { exact: true });
  await field.fill("maria@onboarding.test, j.lee@onboarding.test tom@onboarding ");
  await expect(page.getByText("1 address doesn't look right")).toBeVisible();
  await page.getByRole("button", { name: "Remove tom@onboarding" }).click();

  await expect(page.getByText("With this role they")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send 2 invitations" })).toBeEnabled();
  await page.getByRole("button", { name: "Send 2 invitations" }).click();
  await expect(page.getByRole("heading", { name: "Invitations sent" })).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("link", { name: /Pending \(2\)/ }).click();
  await expect(page.getByText("maria@onboarding.test")).toBeVisible();
  await expect(page.getByText("j.lee@onboarding.test")).toBeVisible();
});

test("a spreadsheet is checked row by row before anything is sent", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/people`);
  await page.getByRole("button", { name: "Invite from spreadsheet" }).click();
  await page.getByLabel("Spreadsheet file").setInputFiles({
    name: "people.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Email,First name,Role,Team\nnew.one@onboarding.test,New,Member,Warehouse\nnot-an-email,Bad,Member,\nnew.one@onboarding.test,Again,Member,\n"
    ),
  });
  await expect(page.getByText("1 ready to send, 2 need attention")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ready, team will be created" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Not a valid email" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Appears twice in the file" })).toBeVisible();

  await page.getByRole("button", { name: "Invite 1 person" }).click();
  await expect(page.getByText("Invitation emailed").or(page.getByText("Created, but email isn't set up"))).toBeVisible();
  expect(await prisma.team.count({ where: { organizationId, name: "Warehouse" } })).toBe(1);
});

test("invitees added to a round get it when they accept", async ({ page }) => {
  const token = randomBytes(24).toString("base64url");
  const round = await prisma.round.create({
    data: {
      organizationId,
      name: "Welcome check",
      purpose: "development",
      items: JSON.stringify([{ kind: "test", id: ANALOGIES }]),
      createdById: ownerId,
    },
  });
  await prisma.invitation.create({
    data: {
      organizationId,
      email: "later@onboarding.test",
      role: "member",
      invitedById: ownerId,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  await prisma.roundInvitee.create({ data: { roundId: round.id, email: "later@onboarding.test" } });

  await page.goto(`/invite/${token}`);
  await page.getByLabel("First name").fill("Lara");
  await page.getByLabel("Last name").fill("Later");
  await page.getByLabel("Password").fill("a-long-password-1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Join Onboarding E2E" }).or(page.getByRole("button", { name: /Accept/ })).first().click();
  await expect(page).toHaveURL(/\/(assessments|consent)/);

  const user = await prisma.user.findUniqueOrThrow({ where: { email: "later@onboarding.test" } });
  expect(await prisma.assignment.count({ where: { roundId: round.id, userId: user.id } })).toBe(1);
  expect(await prisma.roundInvitee.count({ where: { roundId: round.id } })).toBe(0);
});

test("a reminder keeps the first link working", async ({ page, request }) => {
  const token = randomBytes(24).toString("base64url");
  await prisma.invitation.create({
    data: {
      organizationId,
      email: "slow@onboarding.test",
      role: "member",
      invitedById: ownerId,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + 10 * 86_400_000),
      sentAt: new Date(Date.now() - 4 * 86_400_000),
    },
  });

  const cron = await request.post("/api/cron", { headers: { authorization: "Bearer e2e-secret" } });
  expect(cron.ok()).toBe(true);
  const invitation = await prisma.invitation.findFirstOrThrow({ where: { email: "slow@onboarding.test" } });
  expect(invitation.remindersSent).toBe(1);
  expect(invitation.previousTokenHash).toBe(hash(token));

  await page.goto(`/invite/${token}`);
  await expect(page.getByRole("heading", { name: "Join Onboarding E2E" }).or(page.getByText(/Onboarding E2E/).first())).toBeVisible();
  await expect(page.getByRole("heading", { name: "This invitation has expired" })).toHaveCount(0);
});

test("a join link adds employees until it is revoked", async ({ browser, page }) => {
  const admin = await signedIn(browser, ownerId);
  await admin.goto(`/${SLUG}/settings/members`);
  await admin.getByRole("button", { name: "Create a join link" }).click();
  await expect(admin.getByText("Works until")).toBeVisible();
  const link = await prisma.joinLink.findFirstOrThrow({ where: { organizationId } });

  await page.goto(`/join/${link.token}`);
  await expect(page.getByRole("heading", { name: "Join Onboarding E2E" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await page.getByLabel("First name").fill("Jo");
  await page.getByLabel("Last name").fill("Joiner");
  await page.getByLabel("Email").fill("jo@onboarding.test");
  await page.getByLabel("Password").fill("a-long-password-1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Join Onboarding E2E" }).click();
  await expect(page).toHaveURL(/\/(assessments|consent)/);

  const joined = await prisma.user.findUniqueOrThrow({ where: { email: "jo@onboarding.test" }, include: { memberships: true } });
  expect(joined.memberships).toEqual([expect.objectContaining({ organizationId, role: "member" })]);
  expect(joined.emailVerifiedAt).toBeNull();
  expect((await prisma.joinLink.findUniqueOrThrow({ where: { id: link.id } })).uses).toBe(1);

  await admin.reload();
  await admin.getByRole("button", { name: "Revoke" }).last().click();
  await expect.poll(async () => (await prisma.joinLink.findUniqueOrThrow({ where: { id: link.id } })).revokedAt).not.toBeNull();
  const fresh = await (await browser.newContext()).newPage();
  await fresh.goto(`/join/${link.token}`);
  await expect(fresh.getByRole("heading", { name: "This join link doesn't work" })).toBeVisible();
});

test("Google sign-in starts with state and comes back safely", async ({ page, request }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();

  const start = await request.get("/auth/oauth/google?next=/invite/abc", { maxRedirects: 0 });
  expect(start.status()).toBe(307);
  const location = new URL(start.headers()["location"]);
  expect(location.origin).toBe("https://accounts.google.com");
  expect(location.searchParams.get("code_challenge_method")).toBe("S256");
  expect(location.searchParams.get("state")).toBeTruthy();

  // A callback whose state doesn't match what this browser started is refused.
  const forged = await request.get("/auth/oauth/google/callback?code=x&state=forged", { maxRedirects: 0 });
  expect(forged.headers()["location"]).toContain("/auth/sign-in?reason=oauthFailed");
});
