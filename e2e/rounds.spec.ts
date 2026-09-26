import { expect, test, type Page } from "@playwright/test";
import { ORG } from "./fixtures";

// Answers whatever the runner shows (single questions, statement grids, text) until it finishes.
async function answerAll(page: Page) {
  await page.waitForURL(/\/run/);
  for (let step = 0; step < 300; step++) {
    const rows = page.locator("[data-statement]");
    const radios = page.getByRole("radio");
    const text = page.locator("textarea");

    if (await rows.count()) {
      for (let i = 0; i < (await rows.count()); i++) await rows.nth(i).getByRole("radio").first().click();
    } else if (await radios.count()) {
      await radios.first().click();
    } else if (await text.count()) {
      await text.first().fill("An answer");
    } else {
      await page.getByRole("button", { name: /^(Finish|Submit|Save)/ }).last().click();
      break;
    }

    await page.getByRole("button", { name: /^(Next|Finish)$/ }).last().click();
    await page.waitForTimeout(100);
  }
  await page.waitForURL((url) => url.pathname === "/assessments");
}

test("a round goes from the owner to the respondent and back", async ({ browser }) => {
  const owner = await (await browser.newContext({ storageState: "e2e/.auth/owner.json" })).newPage();
  const member = await (await browser.newContext({ storageState: "e2e/.auth/member.json" })).newPage();

  await member.goto("/assessments");
  await expect(member.getByText("Nothing to do right now")).toBeVisible();

  await owner.goto(`/${ORG}/rounds/new`);
  await owner.getByLabel("Name", { exact: true }).fill("E2E check-in");
  await owner.getByLabel("Search tests and questionnaires").fill("Hobbies");
  await owner.getByLabel(/Hobbies/).check();
  await owner.getByLabel("Search tests and questionnaires").fill("");
  await owner.getByText("Sales", { exact: true }).click();
  await owner.getByRole("button", { name: /^Send to 1 person/ }).click();
  await owner.getByRole("button", { name: "Open the round" }).click();
  await owner.waitForURL(/rounds\/[0-9a-f-]{36}$/);
  const roundUrl = owner.url();

  await member.goto("/assessments");
  await expect(member.getByText("E2E check-in")).toBeVisible();
  await member.getByRole("link", { name: "Start" }).first().click();
  await member.waitForURL(/\/forms\//);
  if (!member.url().includes("/run")) await member.getByRole("link", { name: "Start" }).first().click();
  await answerAll(member);
  await expect(member.getByText("Nothing to do right now")).toBeVisible();

  await owner.goto(roundUrl);
  await expect(owner.getByText("1 of 1 finished")).toBeVisible();
});
