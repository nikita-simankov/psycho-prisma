import { expect, test } from "@playwright/test";
import { ANALOGIES, BULK_RESULTS, ORG } from "./fixtures";

test.use({ storageState: "e2e/.auth/owner.json" });

test("long result lists are split into pages", async ({ page }) => {
  const rows = page.locator(`a[href*='/tests/${ANALOGIES}/results/']`);
  await page.goto(`/${ORG}/tests/${ANALOGIES}/results`);
  await expect(rows).toHaveCount(50);
  const pager = page.getByRole("navigation", { name: "Pages" });
  await expect(pager).toContainText("Page 1 of 2");

  await pager.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(rows).toHaveCount(BULK_RESULTS - 50);

  // Out-of-range and malformed pages fall back instead of failing.
  await page.goto(`/${ORG}/tests/${ANALOGIES}/results?page=abc`);
  await expect(rows).toHaveCount(50);
});

test("the people table pages and filters", async ({ page }) => {
  await page.goto(`/${ORG}/people`);
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(50);
  // The pager is client-side: a click that lands before the table hydrates does nothing, so click
  // again until the second page shows. 55 bulk people, the owner and Ann.
  const next = page.getByRole("navigation", { name: "Pages" }).getByRole("button", { name: "Next" });
  await expect(async () => {
    if ((await rows.count()) === 50) await next.click();
    await expect(rows).toHaveCount(BULK_RESULTS + 2 - 50, { timeout: 1000 });
  }).toPass();

  await page.getByRole("textbox").first().fill("Person05");
  await expect(rows).toHaveCount(1);
});
