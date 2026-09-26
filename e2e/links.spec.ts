import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser } from "@playwright/test";
import { createHash, randomBytes, randomUUID } from "node:crypto";

// Round links, email confirmation and invitation links. Everything runs in its own organization
// with its own people, and sessions are created directly so the shared sign-ins stay untouched.

const prisma = new PrismaClient();
const SLUG = "links-e2e";
const PORT_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
let organizationId = "";
const users: Record<"staff" | "other" | "unverified", string> = { staff: "", other: "", unverified: "" };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

async function createUser(key: keyof typeof users, name: string, role: string, verified = true) {
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${key}@links.test`,
      name,
      lastName: "Links",
      password: "unused",
      emailVerifiedAt: verified ? new Date() : null,
    },
  });
  await prisma.membership.create({ data: { userId: user.id, organizationId, role, consentedAt: new Date() } });
  users[key] = user.id;
}

// A browser signed in as someone, with a password session.
async function signedIn(browser: Browser, userId: string) {
  const sessionId = randomBytes(20).toString("hex");
  await prisma.session.create({ data: { id: sessionId, userId, expiresAt: new Date(Date.now() + 86_400_000) } });
  const context = await browser.newContext();
  await context.addCookies([{ name: "auth_cookie", value: sessionId, url: PORT_URL }]);
  return context.newPage();
}

async function roundLink(userId: string) {
  const token = randomBytes(24).toString("base64url");
  const round = await prisma.round.create({
    data: { organizationId, name: "Links check", purpose: "development", items: "[]", createdById: userId },
  });
  await prisma.assignment.create({
    data: { roundId: round.id, userId, items: "[]", tokenHash: hash(token), tokenExpiresAt: new Date(Date.now() + 86_400_000) },
  });
  return `/r/${token}`;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  organizationId = (await prisma.organization.create({ data: { name: "Links E2E", nameKey: "links e2e", slug: SLUG } })).id;
  await createUser("staff", "Stella", "admin");
  await createUser("other", "Otto", "member");
  await createUser("unverified", "Uma", "admin", false);
});

test.afterAll(async () => {
  await prisma.organization.delete({ where: { id: organizationId } });
  await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });
  await prisma.$disconnect();
});

test("a round link opens assessments but not the dashboard", async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await page.goto(await roundLink(users.staff));
  await expect(page).toHaveURL(/\/assessments$/);

  await page.goto(`/${SLUG}`);
  await expect(page).toHaveURL(/\/auth\/sign-in\?reason=link/);
  await expect(page.getByText("Sign in with your password to open the dashboard")).toBeVisible();

  await page.goto("/account");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  expect((await page.request.get("/account/export")).status()).toBe(401);
});

test("a round link asks before switching accounts", async ({ browser }) => {
  const page = await signedIn(browser, users.other);
  const link = await roundLink(users.staff);

  await page.goto(link);
  await expect(page.getByRole("heading", { name: "This link is for Stella" })).toBeVisible();
  await page.getByRole("link", { name: /Stay signed in as Otto/ }).click();
  await expect(page).toHaveURL(/\/assessments$/);
  expect(await prisma.session.count({ where: { userId: users.other } })).toBe(1);

  await page.goto(link);
  await page.getByRole("button", { name: "Continue as Stella" }).click();
  await expect(page).toHaveURL(/\/assessments$/);
  expect(await prisma.session.count({ where: { userId: users.other } })).toBe(0);
  expect(await prisma.session.findFirst({ where: { userId: users.staff }, select: { scope: true } })).toEqual({ scope: "link" });
});

test("an unconfirmed email holds back invitations", async ({ browser }) => {
  const page = await signedIn(browser, users.unverified);
  await page.goto(`/${SLUG}/people`);
  await expect(page.getByText("Confirm your email to send invitations and rounds")).toBeVisible();

  await page.getByRole("button", { name: "Invite people" }).first().click();
  await page.getByLabel("Email", { exact: true }).fill("someone@links.test");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText("Confirm your email first").first()).toBeVisible();
  expect(await prisma.invitation.count({ where: { organizationId } })).toBe(0);
});

test("expired and used invitations explain themselves", async ({ page }) => {
  const expired = randomBytes(24).toString("base64url");
  const used = randomBytes(24).toString("base64url");
  const base = { organizationId, role: "member", invitedById: users.staff };
  await prisma.invitation.createMany({
    data: [
      { ...base, email: "late@links.test", tokenHash: hash(expired), expiresAt: new Date(Date.now() - 86_400_000) },
      { ...base, email: "done@links.test", tokenHash: hash(used), expiresAt: new Date(Date.now() + 86_400_000), acceptedAt: new Date() },
    ],
  });

  await page.goto(`/invite/${expired}`);
  await expect(page.getByRole("heading", { name: "This invitation has expired" })).toBeVisible();
  await expect(page.getByText("Ask Stella Links at Links E2E")).toBeVisible();

  await page.goto(`/invite/${used}`);
  await expect(page.getByRole("heading", { name: "This invitation was already accepted" })).toBeVisible();
});
