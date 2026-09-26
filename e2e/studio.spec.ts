import { expect, test } from "@playwright/test";
import { ORG } from "./fixtures";

test.use({ storageState: "e2e/.auth/owner.json" });

test("an owner builds, publishes and takes a new test", async ({ page }) => {
  await page.goto(`/${ORG}/tests`);
  await page.getByRole("button", { name: "New test" }).click();
  await page.getByLabel("Name").fill("Team climate pulse");
  await page.getByRole("button", { name: "Create and edit" }).click();
  await page.waitForURL(/\/edit$/);
  const testId = page.url().replace(/\/edit$/, "").split("/").pop();

  await page.getByRole("tab", { name: /Questions/ }).click();
  await page.getByRole("button", { name: "Add question" }).click();
  await page.getByLabel("Text of question 1").fill("I have the energy I need at work");
  await page.getByRole("button", { name: "Add choice" }).first().click();
  await page.getByRole("button", { name: "Add choice" }).first().click();
  await page.getByLabel("Choice 1 of question 1").fill("Yes");
  await page.getByLabel("Choice 2 of question 1").fill("No");
  // The preview beside the editor shows the question as respondents will see it.
  const preview = page.locator("#studio-preview");
  await expect(preview.getByRole("heading", { name: "I have the energy I need at work" })).toBeVisible();
  await expect(preview.getByRole("radio", { name: /Yes/ })).toBeVisible();

  await page.getByRole("tab", { name: /Scoring/ }).click();
  await page.getByRole("button", { name: "Add scale" }).click();
  await page.getByLabel("Scale 1", { exact: true }).fill("Wellbeing");
  const points = page.getByLabel("Points for “Yes” in question 1 on Wellbeing");
  if (!(await points.isVisible())) await page.getByRole("button", { name: /Points for answers/ }).click();
  await points.fill("1");

  await page.getByRole("tab", { name: /Interpretations/ }).click();
  await page.getByRole("button", { name: "Add interpretation" }).click();
  await page.getByLabel("To", { exact: true }).fill("10");
  await page.getByLabel("Interpretation", { exact: true }).fill("Score recorded");
  await expect(page.getByText("Saved").first()).toBeVisible();

  await page.getByRole("button", { name: "Publish" }).click();
  await page.getByLabel("What changed").fill("First version");
  await page.getByRole("dialog").getByRole("button", { name: "Publish" }).click();
  await page.waitForURL((url) => url.pathname === `/${ORG}/tests/${testId}`);

  await page.goto(`/tests/${testId}`);
  await page.getByRole("link", { name: /Start/ }).click();
  await page.waitForURL(/\/run/);
  await page.keyboard.press("1");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Finish" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/run"));

  await page.goto(`/${ORG}/tests/${testId}/versions`);
  await expect(page.getByText("First version")).toBeVisible();
});
