import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";

// Wellbeing: anonymous pulse rounds, early warnings, "You said, we did", the leadership digest
// and support after a screening, in their own organization with its own pulse test.

const prisma = new PrismaClient();
const SLUG = "wellbeing-e2e";
const PORT_URL = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
const CRON = { authorization: "Bearer e2e-secret" };
let organizationId = "";
let testId = "";
let opsId = "";
let tinyId = "";
let pulseRoundId = "";
const ids: Record<string, string> = {};
const ops: string[] = [];
const tiny: string[] = [];

async function createUser(key: string, role: string, teamId: string | null = null) {
  const user = await prisma.user.create({
    data: { id: randomUUID(), email: `${key}@wellbeing.test`, name: key[0].toUpperCase() + key.slice(1), lastName: "Wellbeing", password: "unused", emailVerifiedAt: new Date() },
  });
  await prisma.membership.create({ data: { userId: user.id, organizationId, role, teamId, consentedAt: new Date() } });
  ids[key] = user.id;
  return user.id;
}

async function signedIn(browser: Browser, userId: string) {
  const sessionId = randomBytes(20).toString("hex");
  await prisma.session.create({ data: { id: sessionId, userId, expiresAt: new Date(Date.now() + 86_400_000) } });
  const context = await browser.newContext();
  await context.addCookies([{ name: "auth_cookie", value: sessionId, url: PORT_URL }]);
  return context.newPage();
}

// Stored scores in the shape scoring saves them.
const summary = (burnout: number, engagement: number) =>
  JSON.stringify([
    { scale: { id: 1, name: "Burnout" }, grade: burnout, summary: "Recorded" },
    { scale: { id: 2, name: "Engagement" }, grade: engagement, summary: "Recorded" },
  ]);

// A closed, named wellbeing round in which each person gave these scores.
async function namedRound(name: string, createdAt: Date, people: string[], burnout: number, engagement: number) {
  const round = await prisma.round.create({
    data: { organizationId, name, purpose: "wellbeing", items: JSON.stringify([{ kind: "test", id: testId }]), createdById: ids.owner, createdAt, closedAt: new Date() },
  });
  for (const userId of people) {
    const assignment = await prisma.assignment.create({ data: { roundId: round.id, userId, items: round.items, invitedAt: createdAt, completedAt: createdAt } });
    await prisma.testSubmission.create({
      data: { organizationId, userId, testId, assignmentId: assignment.id, submission: "[]", summary: summary(burnout, engagement), createdAt },
    });
  }
  return round.id;
}

async function answerPulse(page: Page, burnout: string) {
  await page.getByRole("link", { name: /Start/ }).click();
  await page.waitForURL(/\/run/);
  await page.getByRole("radio", { name: burnout }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("radio", { name: "Always" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Finish" }).click();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  organizationId = (await prisma.organization.create({ data: { name: "Wellbeing E2E", nameKey: "wellbeing e2e", slug: SLUG } })).id;
  await prisma.subscription.create({ data: { organizationId, plan: "business", status: "active" } });
  opsId = (await prisma.team.create({ data: { organizationId, name: "Ops" } })).id;
  tinyId = (await prisma.team.create({ data: { organizationId, name: "Tiny" } })).id;
  await createUser("owner", "owner");
  await createUser("admin", "admin");
  await createUser("psyche", "psychologist");
  for (let i = 0; i < 6; i++) ops.push(await createUser(`ops${i}`, "member", opsId));
  for (let i = 0; i < 2; i++) tiny.push(await createUser(`tiny${i}`, "member", tinyId));

  const choices = [
    { id: 1, text: "Rarely" },
    { id: 2, text: "Sometimes" },
    { id: 3, text: "Always" },
  ];
  const band = (scaleId: number) => ({ scaleId, strategy: "", minGrade: 0, maxGrade: 100, minTGrade: 0, maxTGrade: 0, minStanValue: 0, maxStanValue: 0, summaryText: "Recorded" });
  testId = (
    await prisma.test.create({
      data: {
        organizationId,
        name: "Pulse check",
        strategy: "grade",
        questions: JSON.stringify([
          { id: 1, text: "I feel exhausted by my work", type: "Один из списка", choices },
          { id: 2, text: "I look forward to my work", type: "Один из списка", choices },
        ]),
        scales: JSON.stringify([
          { id: 1, name: "Burnout", keys: [2, 5, 9].map((grade, index) => ({ questionId: 1, choiceId: index + 1, grade })), multiplier: 1, correction: 0, resultCalculationFormula: "Нет" },
          { id: 2, name: "Engagement", keys: [2, 5, 8].map((grade, index) => ({ questionId: 2, choiceId: index + 1, grade })), multiplier: 1, correction: 0, resultCalculationFormula: "Нет" },
        ]),
        stanTable: "[]",
        tGradeTable: "[]",
        summaryTable: JSON.stringify([band(1), band(2)]),
      },
    })
  ).id;

  // Burnout 7+ across a team raises an alert, 9 for one person shows support; engagement
  // falling by 1.5 since the last round raises one too.
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      wellbeingRules: JSON.stringify([
        { id: "burnout", label: "Burnout", testId, scaleId: 1, direction: "high", team: 7, drop: null, person: 9 },
        { id: "engagement", label: "Engagement", testId, scaleId: 2, direction: "low", team: 3, drop: 1.5, person: null },
      ]),
      supportText: "Our assistance programme is free and confidential.",
      supportContacts: "Helpline: 0800 000 000",
      supportLinks: JSON.stringify([{ label: "Assistance programme", url: "https://eap.example.com" }]),
    },
  });
});

test.afterAll(async () => {
  await prisma.testSubmission.deleteMany({ where: { organizationId } });
  await prisma.auditEvent.deleteMany({ where: { organizationId } });
  await prisma.test.deleteMany({ where: { organizationId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@wellbeing.test" } } });
  await prisma.$disconnect();
});

test("the composer sends an anonymous wellbeing pulse, tests only", async ({ browser }) => {
  const page = await signedIn(browser, ids.owner);
  await page.goto(`/${SLUG}/rounds/new`);
  await page.getByLabel("Name", { exact: true }).fill("October pulse");
  await page.getByText("Wellbeing", { exact: true }).click();
  await page.getByRole("switch", { name: "Anonymous pulse" }).click();
  await page.getByLabel("Search tests and questionnaires").fill("Hobbies");
  await expect(page.getByLabel(/Hobbies/)).toBeDisabled();
  await expect(page.getByText("Questionnaires can't be part of an anonymous round").first()).toBeVisible();
  await page.getByLabel("Search tests and questionnaires").fill("Pulse check");
  await page.getByLabel(/Pulse check/).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: "Ops", exact: true }).click();
  await page.getByRole("checkbox", { name: "Tiny", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Anonymous", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Send to 8 people" }).click();
  // Nothing is emailed without a mail key, so the links are shown to pass on.
  await page.getByRole("button", { name: "Open the round" }).click();
  await page.waitForURL(new RegExp(`/${SLUG}/rounds/[^/]+$`));

  const round = await prisma.round.findFirstOrThrow({ where: { organizationId, name: "October pulse" } });
  pulseRoundId = round.id;
  expect(round.anonymous).toBe(true);
  expect(await prisma.assignment.count({ where: { roundId: round.id } })).toBe(8);
  await expect(page.getByText("Anonymous", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Results appear once the round is closed/)).toBeVisible();
});

test("an anonymous answer is kept without the person, and the promise says so", async ({ browser }) => {
  const assignment = await prisma.assignment.findFirstOrThrow({ where: { roundId: pulseRoundId, userId: ops[0] } });
  const page = await signedIn(browser, ops[0]);
  await page.goto("/assessments");
  await expect(page.getByText("Anonymous", { exact: true })).toBeVisible();
  await page.goto(`/tests/${testId}?assignment=${assignment.id}`);
  await expect(page.getByRole("heading", { name: "This round is anonymous" })).toBeVisible();
  await expect(page.getByText("Your answers are saved without your name.")).toBeVisible();
  await answerPulse(page, "Sometimes");
  await page.waitForURL((url) => url.pathname === "/assessments");

  // The answer holds no person or assignment; only a receipt says the item is done.
  expect(await prisma.testSubmission.count({ where: { organizationId } })).toBe(0);
  const responses = await prisma.pulseResponse.findMany({ where: { roundId: pulseRoundId } });
  expect(responses).toHaveLength(1);
  expect(responses[0].teamId).toBe(opsId);
  expect(JSON.stringify(responses[0])).not.toContain(ops[0]);
  expect(JSON.stringify(responses[0])).not.toContain(assignment.id);
  expect(await prisma.pulseReceipt.count({ where: { assignmentId: assignment.id } })).toBe(1);
  expect((await prisma.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).completedAt).not.toBeNull();
});

test("a worrying anonymous answer shows support but flags nobody", async ({ browser }) => {
  const assignment = await prisma.assignment.findFirstOrThrow({ where: { roundId: pulseRoundId, userId: ops[1] } });
  const page = await signedIn(browser, ops[1]);
  await page.goto(`/tests/${testId}?assignment=${assignment.id}`);
  await answerPulse(page, "Always");
  await expect(page.getByRole("heading", { name: "Support is here if you need it" })).toBeVisible();
  await expect(page.getByText("Our assistance programme is free and confidential.")).toBeVisible();
  await expect(page.getByText("Helpline: 0800 000 000")).toBeVisible();
  await expect(page.getByRole("link", { name: "Assistance programme" })).toHaveAttribute("href", "https://eap.example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL((url) => url.pathname === "/assessments");
  expect(await prisma.careFlag.count({ where: { organizationId } })).toBe(0);
});

test("the hourly job warns about a team past its level, once, and results stay masked for small teams", async ({ browser, request }) => {
  // The rest of Ops and both of Tiny answer; Ops ends up with high burnout.
  for (const [userId, teamId, burnout] of [...ops.slice(2).map((id) => [id, opsId, 9]), ...tiny.map((id) => [id, tinyId, 2])] as [string, string, number][]) {
    await prisma.pulseResponse.create({ data: { organizationId, roundId: pulseRoundId, teamId, testId, summary: summary(burnout, 8), submission: "[]" } });
    const assignment = await prisma.assignment.findFirstOrThrow({ where: { roundId: pulseRoundId, userId } });
    await prisma.pulseReceipt.create({ data: { assignmentId: assignment.id, item: `test:${testId}` } });
  }

  // Nothing is read while the round is open.
  expect((await request.post("/api/cron", { headers: CRON })).ok()).toBe(true);
  expect(await prisma.wellbeingAlert.count({ where: { organizationId } })).toBe(0);

  await prisma.round.update({ where: { id: pulseRoundId }, data: { closedAt: new Date() } });
  expect((await request.post("/api/cron", { headers: CRON })).ok()).toBe(true);
  const alerts = await prisma.wellbeingAlert.findMany({ where: { organizationId } });
  expect(alerts.map((alert) => [alert.teamId, alert.ruleId, alert.kind])).toEqual([[opsId, "burnout", "threshold"]]);
  expect(alerts[0].emailedAt).not.toBeNull();
  // A second run records and emails nothing new.
  expect((await request.post("/api/cron", { headers: CRON })).ok()).toBe(true);
  expect(await prisma.wellbeingAlert.count({ where: { organizationId } })).toBe(1);

  const page = await signedIn(browser, ids.admin);
  await page.goto(`/${SLUG}/rounds/${pulseRoundId}`);
  const results = page.locator("section").filter({ has: page.getByRole("heading", { name: "Anonymous results" }) });
  await expect(results.getByRole("rowheader", { name: /Ops/ })).toBeVisible();
  await expect(results.getByRole("rowheader", { name: /Tiny/ })).toBeVisible();
  await expect(results.locator("[data-privacy-mask]").first()).toBeVisible();
  await expect(results.getByText("8.3")).toBeVisible();

  await page.goto(`/${SLUG}`);
  await expect(page.getByText("Ops: Burnout is past the level you set")).toBeVisible();
  await expect(page.getByText("Suggested next steps")).toBeVisible();
  await page.goto(`/${SLUG}/analytics`);
  await expect(page.getByText("Ops: Burnout is past the level you set")).toBeVisible();
  await page.getByRole("button", { name: "Mark as handled" }).click();
  await expect.poll(async () => (await prisma.wellbeingAlert.findFirstOrThrow({ where: { organizationId } })).resolvedAt).not.toBeNull();
});

test("a sharp drop since the previous round raises its own alert", async ({ request }) => {
  const earlier = await namedRound("Spring check", new Date(Date.now() - 40 * 86_400_000), ops.slice(1), 3, 8);
  const later = await namedRound("Summer check", new Date(Date.now() - 20 * 86_400_000), ops.slice(1), 3, 5);
  expect((await request.post("/api/cron", { headers: CRON })).ok()).toBe(true);
  const drops = await prisma.wellbeingAlert.findMany({ where: { organizationId, kind: "drop" } });
  expect(drops.map((alert) => [alert.roundId, alert.ruleId, alert.previous, alert.value])).toEqual([[later, "engagement", 8, 5]]);
  expect(drops.some((alert) => alert.roundId === earlier)).toBe(false);
});

test("staff record what they did, and people see it before the next pulse", async ({ browser }) => {
  const staff = await signedIn(browser, ids.owner);
  await staff.goto(`/${SLUG}/rounds/${pulseRoundId}`);
  await staff.getByLabel("Action", { exact: true }).fill("No meetings on Friday afternoons");
  await staff.getByRole("button", { name: "Add" }).click();
  await expect(staff.getByText("No meetings on Friday afternoons")).toBeVisible();
  await expect.poll(() => prisma.teamAction.count({ where: { organizationId, teamId: opsId } })).toBe(1);

  const person = await signedIn(browser, ops[0]);
  await person.goto("/assessments");
  await expect(person.getByRole("heading", { name: "You said, we did" })).toBeVisible();
  await expect(person.getByText("No meetings on Friday afternoons")).toBeVisible();
  // Tiny sees nothing meant for Ops.
  const other = await signedIn(browser, tiny[0]);
  await other.goto("/assessments");
  await expect(other.getByText("No meetings on Friday afternoons")).toHaveCount(0);

  const next = await prisma.round.create({
    data: { organizationId, name: "November pulse", purpose: "wellbeing", anonymous: true, items: JSON.stringify([{ kind: "test", id: testId }]), createdById: ids.owner },
  });
  const assignment = await prisma.assignment.create({ data: { roundId: next.id, userId: ops[0], items: next.items, invitedAt: new Date() } });
  await person.goto(`/tests/${testId}?assignment=${assignment.id}`);
  await expect(person.getByText("Before you start: what was done after the last pulse.")).toBeVisible();
  await expect(person.getByText("No meetings on Friday afternoons")).toBeVisible();
});

test("a worrying named result shows support and asks a psychologist to check in", async ({ browser }) => {
  const round = await prisma.round.create({
    data: { organizationId, name: "Named check", purpose: "wellbeing", items: JSON.stringify([{ kind: "test", id: testId }]), createdById: ids.owner },
  });
  const assignment = await prisma.assignment.create({ data: { roundId: round.id, userId: ops[2], items: round.items, invitedAt: new Date() } });
  const page = await signedIn(browser, ops[2]);
  await page.goto(`/tests/${testId}?assignment=${assignment.id}`);
  await answerPulse(page, "Always");
  await expect(page.getByRole("heading", { name: "Support is here if you need it" })).toBeVisible();

  const flag = await prisma.careFlag.findFirstOrThrow({ where: { organizationId, userId: ops[2] } });
  expect(flag.reason).not.toMatch(/"(grade|value)"/);
  expect(await prisma.auditEvent.count({ where: { organizationId, action: "raiseCareFlag", subjectId: ops[2] } })).toBe(1);

  // An admin can't see it or why.
  const admin = await signedIn(browser, ids.admin);
  await admin.goto(`/${SLUG}/people/${ops[2]}`);
  await expect(admin.getByRole("heading", { name: /Ops2/ }).first()).toBeVisible();
  await expect(admin.locator("[data-care-flag]")).toHaveCount(0);
  await admin.goto(`/${SLUG}`);
  await expect(admin.getByText(/may need support/)).toHaveCount(0);

  const psychologist = await signedIn(browser, ids.psyche);
  await psychologist.goto(`/${SLUG}`);
  await expect(psychologist.getByText("1 person may need support")).toBeVisible();
  await psychologist.goto(`/${SLUG}/people/follow-up`);
  const care = psychologist.locator("section").filter({ has: psychologist.getByRole("heading", { name: "Care check-ins" }) });
  await expect(care.getByRole("link", { name: /Ops2/ })).toBeVisible();
  await expect(care.getByText(/Pulse check: Burnout/)).toBeVisible();
  await psychologist.goto(`/${SLUG}/people/${ops[2]}`);
  await expect(psychologist.locator("[data-care-flag]")).toBeVisible();
  await psychologist.getByRole("button", { name: "Mark as followed up" }).click();
  await expect.poll(async () => (await prisma.careFlag.findUniqueOrThrow({ where: { id: flag.id } })).resolvedAt).not.toBeNull();
});

test("support resources and the digest are set in settings, with a preview", async ({ browser }) => {
  const page = await signedIn(browser, ids.owner);
  await page.goto(`/${SLUG}/settings/support`);
  // Adding a row first also waits for the form to hydrate before typing.
  await page.getByRole("button", { name: "Add link" }).click();
  await expect(page.getByLabel("Label", { exact: true })).toHaveCount(2);
  await page.getByLabel("Message").fill("Talk to us any time.");
  await page.getByLabel("Label", { exact: true }).nth(1).fill("Crisis line");
  await page.getByLabel("Address", { exact: true }).nth(1).fill("tel:112");
  await page.getByRole("button", { name: "Save" }).click();
  await expect
    .poll(async () => {
      const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
      return [organization.supportText, JSON.parse(organization.supportLinks).length];
    })
    .toEqual(["Talk to us any time.", 2]);

  await page.goto(`/${SLUG}/settings/wellbeing`);
  await expect(page.locator('[data-rule="burnout"]')).toBeVisible();
  await page.getByRole("button", { name: "Preview this week" }).click();
  await expect(page.getByText("Subject: Weekly wellbeing digest for Wellbeing E2E")).toBeVisible();
  const preview = page.frameLocator('iframe[title="Preview"]');
  // Organization-wide, with Tiny's answers counted in, against the summer round.
  await expect(preview.getByText("Burnout: 6.8, was 3 (worse).")).toBeVisible();
  await expect(preview.getByText("Ops: No meetings on Friday afternoons (planned).")).toBeVisible();

  await page.getByRole("switch", { name: "Send the weekly digest" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect.poll(async () => (await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).digestEnabled).toBe(false);
  // The rules are kept as they were.
  expect(JSON.parse((await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).wellbeingRules)).toHaveLength(2);
});

test("the hourly job sends the digest on its weekday, once a week", async ({ request }) => {
  await prisma.organization.update({ where: { id: organizationId }, data: { digestEnabled: false, digestWeekday: new Date().getDay(), digestSentAt: null } });
  expect((await request.post("/api/cron", { headers: CRON })).ok()).toBe(true);
  expect((await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).digestSentAt).toBeNull();

  await prisma.organization.update({ where: { id: organizationId }, data: { digestEnabled: true } });
  expect((await request.post("/api/cron", { headers: CRON })).ok()).toBe(true);
  const sent = (await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).digestSentAt;
  expect(sent).not.toBeNull();
  expect((await request.post("/api/cron", { headers: CRON })).ok()).toBe(true);
  expect((await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } })).digestSentAt).toEqual(sent);
});
