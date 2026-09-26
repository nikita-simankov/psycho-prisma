import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { ANALOGIES } from "./fixtures";

// Results you can trust: answer quality, error bands, scale notes, reliable change, own norms,
// team balance, the privacy mask and item statistics. Everything runs in its own organization
// with enough people for the organization's own norms (30) and item statistics (20).

const prisma = new PrismaClient();
const SLUG = "results-e2e";
const PORT_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const PEOPLE = 34;
let organizationId = "";
let ownerId = "";
let rileyId = "";
let speedyId = "";
let customTestId = "";
const userIds: string[] = [];

async function createUser(name: string, role: string, teamId: string | null = null) {
  const user = await prisma.user.create({
    data: { id: randomUUID(), email: `${name.toLowerCase()}@results.test`, name, lastName: "Results", password: "unused", emailVerifiedAt: new Date() },
  });
  await prisma.membership.create({ data: { userId: user.id, organizationId, role, teamId, consentedAt: new Date() } });
  userIds.push(user.id);
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
  organizationId = (await prisma.organization.create({ data: { name: "Results E2E", nameKey: "results e2e", slug: SLUG } })).id;
  await prisma.subscription.create({ data: { organizationId, plan: "business", status: "active" } });
  const big = await prisma.team.create({ data: { organizationId, name: "Analysts" } });
  const tiny = await prisma.team.create({ data: { organizationId, name: "Tiny" } });
  ownerId = await createUser("Olga", "owner");

  // Analogies answers with the first `right` questions correct and the rest wrong.
  const analogies = await prisma.test.findUniqueOrThrow({ where: { id: ANALOGIES } });
  const questions: { id: number; choices: { id: number }[] }[] = JSON.parse(analogies.questions);
  const keys: { questionId: number; choiceId: number }[] = JSON.parse(analogies.scales)[0].keys;
  const answers = (right: number) =>
    JSON.stringify(
      questions.map((question, index) => {
        const correct = keys.find((key) => key.questionId === question.id)!.choiceId;
        return { questionId: question.id, choiceId: index < right ? correct : question.choices.find((choice) => choice.id !== correct)!.id };
      })
    );
  const submit = (userId: string, submission: string, daysAgo: number, timings = "{}") =>
    prisma.testSubmission.create({
      data: { organizationId, userId, testId: ANALOGIES, submission, summary: "", timings, locale: "ru", createdAt: new Date(Date.now() - daysAgo * 86_400_000) },
    });

  for (let i = 0; i < PEOPLE; i++) {
    const userId = await createUser(`Person${i}`, "member", big.id);
    await submit(userId, answers(i % 30), 10);
  }
  for (const name of ["Tina", "Tom"]) await submit(await createUser(name, "member", tiny.id), answers(15), 10);

  // Riley went from no right answers to all of them: a reliable change.
  rileyId = await createUser("Riley", "member", big.id);
  await submit(rileyId, answers(0), 200);
  await submit(rileyId, answers(30), 1);

  // Speedy chose the first option everywhere, far faster than anyone reads.
  speedyId = await createUser("Speedy", "member", big.id);
  await submit(
    speedyId,
    JSON.stringify(questions.map((question) => ({ questionId: question.id, choiceId: question.choices[0].id }))),
    0,
    JSON.stringify(Object.fromEntries(questions.map((question) => [question.id, 400])))
  );

  // The organization's own four-item questionnaire, answered by 25 people.
  const custom = await prisma.test.create({
    data: {
      organizationId,
      name: "Results E2E Scale",
      strategy: "grade",
      questions: JSON.stringify([1, 2, 3, 4].map((id) => ({ id, text: `Statement ${id}`, type: "List", choices: [{ id: 1, text: "Yes" }, { id: 2, text: "No" }] }))),
      scales: JSON.stringify([{ id: 1, name: "Openness", keys: [1, 2, 3, 4].map((questionId) => ({ questionId, choiceId: 1, grade: 1 })), multiplier: 1, correction: 0, resultCalculationFormula: "Нет" }]),
      stanTable: "[]",
      tGradeTable: "[]",
      summaryTable: "[]",
    },
  });
  customTestId = custom.id;
  for (let i = 0; i < 25; i++) {
    const yes = i % 5;
    await prisma.testSubmission.create({
      data: {
        organizationId,
        userId: userIds[1 + i],
        testId: custom.id,
        summary: "",
        submission: JSON.stringify([1, 2, 3, 4].map((questionId) => ({ questionId, choiceId: questionId <= yes ? 1 : 2 }))),
      },
    });
  }
});

test.afterAll(async () => {
  await prisma.testSubmission.deleteMany({ where: { organizationId } });
  await prisma.test.deleteMany({ where: { organizationId } });
  await prisma.organization.delete({ where: { id: organizationId } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

test("results lists show a profile strip and flag poor answer quality", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/tests/${ANALOGIES}/results`);
  await expect(page.locator("[data-profile-strip]").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Speedy/ }).getByText("Quality 0")).toBeVisible();
});

test("a result shows answer quality, error bands, scale notes and own norms", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  const speedy = await prisma.testSubmission.findFirstOrThrow({ where: { userId: speedyId } });
  await page.goto(`/${SLUG}/tests/${ANALOGIES}/results/${speedy.id}`);

  const quality = page.getByRole("region", { name: "Answer quality" });
  await expect(quality).toContainText("0/100");
  await expect(quality).toContainText("Poor");
  await expect(page.locator("[data-sem-band]").first()).toBeVisible();

  await page.locator("[data-scale-info]").first().click();
  await expect(page.getByRole("dialog").getByText("What does this mean?")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Our organization" }).click();
  await expect(page).toHaveURL(/norms=org/);
  await expect(page.getByText(/compared with the latest results of \d+ people in your organization/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Our organization" })).toHaveAttribute("aria-current", "true");
});

test("a person's page overlays the previous profile and names reliable change", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/people/${rileyId}`);
  const overlay = page.locator("[data-profile-overlay]");
  await expect(overlay).toBeVisible();
  await expect(overlay.locator("[data-change=up]")).toHaveText("Reliable increase");
});

test("analytics shows team balance and masks small teams the same way everywhere", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/analytics?test=${ANALOGIES}`);
  const balance = page.locator("[data-balance-map]");
  await expect(balance.getByRole("region", { name: "Analysts" })).toBeVisible();
  await expect(balance.getByRole("region", { name: "Tiny" }).locator("[data-privacy-mask]")).toBeVisible();
  // The heatmap holds the same small team back with the same mask.
  await expect(page.getByRole("row", { name: /Tiny/ }).locator("[data-privacy-mask]")).toBeVisible();
  await expect(page.locator("[data-privacy-mask]").first()).toContainText("Fewer than 5 people, hidden for privacy");
});

test("the studio shows item statistics for the organization's own test", async ({ browser }) => {
  const page = await signedIn(browser, ownerId);
  await page.goto(`/${SLUG}/tests/${customTestId}/edit`);
  const analysis = page.locator("[data-item-analysis]");
  await expect(analysis.getByRole("heading", { name: "Item statistics" })).toBeVisible();
  await expect(analysis).toContainText("25 responses to published version 1");
  await analysis.getByText("Openness").click();
  await expect(analysis.getByRole("cell", { name: "Statement 1" })).toBeVisible();
  await expect(analysis).toContainText("α 0.");
});
