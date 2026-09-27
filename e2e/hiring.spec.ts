import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser } from "@playwright/test";
import { randomBytes, randomUUID, scryptSync, createHash } from "node:crypto";
import { violations } from "./axe";

// Hiring: target profiles and fit, candidates side by side, report share links with an access
// code, strengths feedback and the interview guide, in their own organization and hiring round.

const prisma = new PrismaClient();
const SLUG = "hiring-e2e";
const PORT_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const SCALES = ["Drive", "Calm", "Care"];
let organizationId = "";
let ownerId = "";
let testId = "";
let roundId = "";
const candidates: Record<string, { userId: string; submissionId: string }> = {};

// Same scheme as src/utils/share-links.ts, for links made straight in the database.
const hashCode = (code: string, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(code, salt, 32).toString("hex")}`;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function signedIn(browser: Browser, userId: string) {
  const sessionId = randomBytes(20).toString("hex");
  await prisma.session.create({ data: { id: sessionId, userId, expiresAt: new Date(Date.now() + 86_400_000) } });
  const context = await browser.newContext();
  await context.addCookies([{ name: "auth_cookie", value: sessionId, url: PORT_URL }]);
  return context.newPage();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  organizationId = (await prisma.organization.create({ data: { name: "Hiring E2E", nameKey: "hiring e2e", slug: SLUG } })).id;
  await prisma.subscription.create({ data: { organizationId, plan: "business", status: "active" } });
  ownerId = (
    await prisma.user.create({
      data: { id: randomUUID(), email: "owner@hiring-e2e.test", name: "Hana", lastName: "Owner", password: "unused", emailVerifiedAt: new Date() },
    })
  ).id;
  await prisma.membership.create({ data: { userId: ownerId, organizationId, role: "owner", consentedAt: new Date() } });

  // Three scales of three yes/no statements each; 0–3 yeses give stens 2, 4, 7 and 9.
  const questions = SCALES.flatMap((_, scale) =>
    [1, 2, 3].map((item) => ({ id: scale * 3 + item, text: `Statement ${scale * 3 + item}`, type: "List", choices: [{ id: 1, text: "Yes" }, { id: 2, text: "No" }] }))
  );
  const test = await prisma.test.create({
    data: {
      organizationId,
      name: "Work Style E2E",
      strategy: "standard-ten",
      questions: JSON.stringify(questions),
      scales: JSON.stringify(
        SCALES.map((name, scale) => ({
          id: scale + 1,
          name,
          keys: [1, 2, 3].map((item) => ({ questionId: scale * 3 + item, choiceId: 1, grade: 1 })),
          multiplier: 1,
          correction: 0,
          resultCalculationFormula: "Нет",
        }))
      ),
      stanTable: JSON.stringify(
        SCALES.flatMap((_, scale) => [2, 4, 7, 9].map((stanValue, grade) => ({ scaleId: scale + 1, minGrade: grade, maxGrade: grade, stanValue })))
      ),
      tGradeTable: "[]",
      summaryTable: JSON.stringify(
        SCALES.map((name, scale) => ({
          scaleId: scale + 1,
          strategy: "standard-ten",
          minGrade: 0,
          maxGrade: 3,
          minTGrade: 0,
          maxTGrade: 0,
          minStanValue: 1,
          maxStanValue: 10,
          summaryText: `${name} reading.`,
        }))
      ),
    },
  });
  testId = test.id;

  const items = JSON.stringify([{ kind: "test", id: testId }]);
  roundId = (await prisma.round.create({ data: { organizationId, name: "Sales hire", purpose: "hiring", items, createdById: ownerId } })).id;

  // How many statements each candidate agreed with per scale: Drive, Calm, Care.
  const people: [string, string, number[]][] = [
    ["Alex", "Archer", [3, 2, 1]],
    ["Bea", "Baker", [1, 3, 2]],
    ["Cy", "Cole", [0, 0, 3]],
  ];
  for (const [name, lastName, yeses] of people) {
    const user = await prisma.user.create({
      data: { id: randomUUID(), email: `${name.toLowerCase()}@hiring-e2e.test`, name, lastName, password: "unused", emailVerifiedAt: new Date() },
    });
    await prisma.membership.create({ data: { userId: user.id, organizationId, role: "candidate", consentedAt: new Date() } });
    const assignment = await prisma.assignment.create({ data: { roundId, userId: user.id, items, completedAt: new Date() } });
    const submission = await prisma.testSubmission.create({
      data: {
        organizationId,
        userId: user.id,
        testId,
        assignmentId: assignment.id,
        summary: "",
        submission: JSON.stringify(
          questions.map((question) => {
            const scale = Math.floor((question.id - 1) / 3);
            const item = (question.id - 1) % 3;
            return { questionId: question.id, choiceId: item < yeses[scale] ? 1 : 2 };
          })
        ),
      },
    });
    candidates[name] = { userId: user.id, submissionId: submission.id };
  }
  await prisma.userSummary.create({
    data: { organizationId, userId: candidates.Alex.userId, verdict: "A steady fit for the sales team.", additionalNotes: "Internal background note." },
  });
});

test.afterAll(async () => {
  await prisma.testSubmission.deleteMany({ where: { organizationId } });
  await prisma.userSummary.deleteMany({ where: { organizationId } });
  await prisma.auditEvent.deleteMany({ where: { organizationId } });
  await prisma.test.deleteMany({ where: { organizationId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@hiring-e2e.test" } } });
  await prisma.$disconnect();
});

test("a target profile gives each result a fit and draws its ranges", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/tests/${testId}/targets`);
  await expect(page.getByText("No target profiles yet")).toBeVisible();

  await page.getByRole("button", { name: "New profile" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Sales role");
  await dialog.getByRole("checkbox", { name: "Set a target for Drive" }).click();
  await dialog.getByLabel("From, Drive").fill("6");
  await dialog.getByLabel("To, Drive").fill("10");
  await dialog.getByText("Interview questions").click();
  await dialog.getByLabel("When the score is below the range").fill("What keeps you going when a target feels far away?");
  await dialog.getByRole("checkbox", { name: "Set a target for Calm" }).click();
  await dialog.getByLabel("To, Calm").fill("8");
  await dialog.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Drive 6–10 · Calm 4–8")).toBeVisible();
  const profile = await prisma.targetProfile.findFirstOrThrow({ where: { organizationId, testId } });
  expect(JSON.parse(profile.scales)).toHaveLength(2);

  // Alex: Drive 9 and Calm 7, both inside. Bea: Drive 4 below, Calm 9 above.
  await page.goto(`/${SLUG}/tests/${testId}/results`);
  await expect(page.getByRole("link", { name: /Archer Alex/ }).getByText("2 of 2 in range")).toBeVisible();
  await expect(page.getByRole("link", { name: /Baker Bea/ }).getByText("0 of 2 in range")).toBeVisible();

  await page.goto(`/${SLUG}/tests/${testId}/results/${candidates.Bea.submissionId}`);
  await expect(page.getByRole("heading", { name: "Fit with Sales role" })).toBeVisible();
  await expect(page.getByText("Below 6–10")).toBeVisible();
  await expect(page.getByText("Above 4–8")).toBeVisible();
  await expect(page.locator("[data-target-band]")).toHaveCount(2);
  await expect(page.getByRole("img", { name: /Drive: sten 4, Average, .*target range 6–10/ })).toBeVisible();

  // Without a profile the fit and ranges go away.
  await page.getByLabel("Target profile").click();
  await page.getByRole("option", { name: "No target profile" }).click();
  await expect(page).toHaveURL(/target=none/);
  await expect(page.locator("[data-target-band]")).toHaveCount(0);
});

test("candidates from a hiring round are compared side by side with the target", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/rounds/${roundId}`);
  await expect(page.getByRole("heading", { name: "Candidates' results" })).toBeVisible();
  await expect(page.getByText("Fit with Sales role")).toBeVisible();
  const compare = page.getByRole("button", { name: "Compare", exact: true });
  await expect(compare).toBeDisabled();
  await page.getByRole("checkbox", { name: "Compare Archer Alex" }).check();
  await page.getByRole("checkbox", { name: "Compare Baker Bea" }).check();
  await expect(page.getByText("2 ticked.")).toBeVisible();
  await compare.click();

  await expect(page).toHaveURL(new RegExp(`/${SLUG}/tests/${testId}/compare\\?`));
  await expect(page.getByRole("heading", { name: "Side by side" })).toBeVisible();
  const header = page.getByRole("columnheader");
  await expect(header.filter({ hasText: "Archer Alex" }).getByText("2 of 2 in range")).toBeVisible();
  await expect(header.filter({ hasText: "Baker Bea" }).getByText("0 of 2 in range")).toBeVisible();
  await expect(page.getByRole("rowheader", { name: /Drive/ }).getByText("Target 6–10")).toBeVisible();
  // Two people, two targeted scales: four brackets.
  await expect(page.locator("[data-target-band]")).toHaveCount(4);
  await expect(page.getByRole("img", { name: /^Archer Alex: Drive: sten 9, High/ })).toBeVisible();
  expect(await violations(page)).toEqual([]);

  // Three people can be picked from the test's results too.
  await page.goto(`/${SLUG}/tests/${testId}/results`);
  for (const name of ["Archer Alex", "Baker Bea", "Cole Cy"]) await page.getByRole("checkbox", { name: `Compare ${name}` }).check();
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByRole("columnheader").filter({ hasText: "Cole Cy" })).toBeVisible();
  await expect(page.getByText("3 people on the same scales")).toBeVisible();
});

test("the interview guide asks about scales outside the target and at the extremes", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  // Cy: Drive 2 and Calm 2 below their targets, Care 9 at the top of the scale.
  await page.goto(`/${SLUG}/tests/${testId}/results/${candidates.Cy.submissionId}`);
  await page.getByRole("link", { name: "Interview guide" }).click();
  await expect(page.getByRole("heading", { name: "Interview guide", level: 1 })).toBeVisible();
  const topics = page.locator("[data-topic]");
  await expect(topics).toHaveCount(3);
  await expect(topics.nth(0)).toContainText("Below the target 6–10");
  await expect(topics.nth(0)).toContainText("What keeps you going when a target feels far away?");
  await expect(topics.filter({ hasText: "Care" })).toContainText("Tell me about a time when your strength in “Care” helped you");
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
});

test("a share link opens one report with its code, logs each view and can be revoked", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/reports/${candidates.Alex.userId}`);
  await page.getByRole("button", { name: "Share report" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Who it's for").fill("Dana");
  await dialog.getByRole("button", { name: "Create link" }).click();
  await expect(dialog.getByRole("heading", { name: "Link ready" })).toBeVisible();
  const link = await dialog.getByRole("textbox", { name: "Link" }).inputValue();
  const code = await dialog.getByRole("textbox", { name: "Access code" }).inputValue();
  expect(code).toMatch(/^\d{6}$/);
  const token = link.split("/share/")[1];

  // Only hashes are stored.
  const share = await prisma.reportShare.findFirstOrThrow({ where: { organizationId, userId: candidates.Alex.userId } });
  expect(share.tokenHash).toBe(hashToken(token));
  expect(share.codeHash).not.toContain(code);
  expect(share.recipient).toBe("Dana");

  // The recipient has no account.
  const recipient = await (await browser.newContext()).newPage();
  const response = await recipient.goto(`/share/${token}`);
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(recipient.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(recipient.getByRole("heading", { name: "Enter the access code" })).toBeVisible();
  await expect(recipient.getByText("Archer")).toHaveCount(0);

  await recipient.getByLabel("Access code").fill(code === "000000" ? "111111" : "000000");
  await recipient.getByRole("button", { name: "Open report" }).click();
  await expect(recipient.locator("#access-code-error")).toHaveText("That code isn't right. Check it and try again.");
  await recipient.getByLabel("Access code").fill(code);
  await recipient.getByRole("button", { name: "Open report" }).click();
  await expect(recipient.getByRole("heading", { name: "Archer Alex", level: 1 })).toBeVisible();
  await expect(recipient.getByText("Shared by Hiring E2E")).toBeVisible();
  await expect(recipient.getByRole("heading", { name: "Work Style E2E" })).toBeVisible();
  await expect(recipient.getByText("A steady fit for the sales team.")).toBeVisible();
  // Read-only and only this report: no answers, no internal notes, no way into the dashboard.
  await expect(recipient.getByText("Internal background note.")).toHaveCount(0);
  await expect(recipient.getByText(/^Answers/)).toHaveCount(0);
  await expect(recipient.getByRole("textbox")).toHaveCount(0);
  expect(await violations(recipient)).toEqual([]);

  // A reload keeps it open and is another view.
  await recipient.reload();
  await expect(recipient.getByRole("heading", { name: "Archer Alex", level: 1 })).toBeVisible();
  await expect.poll(() => prisma.auditEvent.count({ where: { organizationId, action: "viewSharedReport", subjectId: candidates.Alex.userId } })).toBe(2);
  expect((await prisma.reportShare.findUniqueOrThrow({ where: { id: share.id } })).views).toBe(2);

  // The sharer sees the views and revokes the link.
  await page.reload();
  await expect(page.getByText(/Opened 2 times/)).toBeVisible();
  await page.getByRole("button", { name: "Revoke the link for Dana" }).click();
  await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
  await recipient.reload();
  await expect(recipient.getByRole("heading", { name: "This link no longer works" })).toBeVisible();

  // The audit log names the recipient.
  await page.goto(`/${SLUG}/settings/audit`);
  await expect(page.getByRole("cell", { name: "Report opened by link" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "Link recipient" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: /For: Dana/ }).first()).toBeVisible();
});

test("wrong codes lock a share link and expired links stop working", async ({ browser }) => {
  const make = async (expiresAt: Date) => {
    const token = randomBytes(32).toString("base64url");
    await prisma.reportShare.create({
      data: {
        organizationId,
        userId: candidates.Bea.userId,
        tokenHash: hashToken(token),
        codeHash: hashCode("246810"),
        submissionIds: JSON.stringify([candidates.Bea.submissionId]),
        expiresAt,
        createdById: ownerId,
      },
    });
    return token;
  };

  const page = await (await browser.newContext()).newPage();
  const token = await make(new Date(Date.now() + 86_400_000));
  await page.goto(`/share/${token}`);
  for (let attempt = 1; attempt <= 5; attempt++) {
    await page.getByLabel("Access code").fill(`00000${attempt}`);
    await page.getByRole("button", { name: "Open report" }).click();
    await expect(page.locator("#access-code-error")).toHaveText(attempt < 5 ? "That code isn't right. Check it and try again." : /link is locked/);
  }
  // Locked: even the right code is refused.
  await page.getByLabel("Access code").fill("246810");
  await page.getByRole("button", { name: "Open report" }).click();
  await expect(page.locator("#access-code-error")).toHaveText(/link is locked/);
  await expect(page.getByRole("heading", { name: "Baker Bea" })).toHaveCount(0);

  await page.goto(`/share/${await make(new Date(Date.now() - 1000))}`);
  await expect(page.getByRole("heading", { name: "This link no longer works" })).toBeVisible();
});

test("a candidate gets strengths feedback after a preview, and it is recorded", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/reports/${candidates.Alex.userId}`);
  await page.getByRole("button", { name: "Prepare feedback" }).click();
  const preview = page.getByRole("dialog").locator("[data-feedback-preview]");
  // Alex: Drive 9 and Calm 7 are strengths; Care 4 is never named, and no score appears.
  await expect(preview).toContainText("To: alex@hiring-e2e.test");
  await expect(preview).toContainText("Drive: this stood out as a particular strength.");
  await expect(preview).toContainText("Calm: this came through as a strength.");
  await expect(preview).not.toContainText("Care");
  await expect(preview).not.toContainText(/\b[0-9]\b|sten/i);

  await page.getByLabel("A few words of your own (optional)").fill("It was a pleasure to meet you.");
  const send = page.getByRole("button", { name: "Send feedback" });
  await expect(send).toBeDisabled();
  await page.getByRole("button", { name: "Update preview" }).click();
  await expect(preview).toContainText("It was a pleasure to meet you.");
  await send.click();
  // No mail service in e2e, so it is recorded without an email.
  await expect(page.getByText(/Feedback recorded/).first()).toBeVisible();

  const sent = await prisma.sentFeedback.findFirstOrThrow({ where: { organizationId, userId: candidates.Alex.userId } });
  expect(JSON.parse(sent.strengths)).toEqual(["Drive", "Calm"]);
  expect(sent).toMatchObject({ note: "It was a pleasure to meet you.", emailed: false, sentById: ownerId });
  await expect(page.locator("[data-feedback-sent]")).toContainText("Drive, Calm");
  await expect.poll(() => prisma.auditEvent.count({ where: { organizationId, action: "sendCandidateFeedback" } })).toBe(1);
});
