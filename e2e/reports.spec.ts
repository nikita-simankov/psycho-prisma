import { expect, test, type Page } from "@playwright/test";
import { violations } from "./axe";
import { ORG } from "./fixtures";

// Reports read as documents on screen and print on white paper in either theme.
test.use({ storageState: "e2e/.auth/owner.json" });

async function openReport(page: Page) {
  await page.goto(`/${ORG}`);
  await page.locator(`a[href^="/${ORG}/reports/"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/${ORG}/reports/[^/]+$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

for (const theme of ["light", "dark"] as const) {
  test(`a report in the ${theme} theme has no serious accessibility issues`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await openReport(page);
    expect(await violations(page)).toEqual([]);
  });
}

test("a report prints on white paper even in the dark theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await openReport(page);
  await page.emulateMedia({ media: "print" });
  const background = await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).toBe("rgb(255, 255, 255)");
  await expect(page.locator("[data-sidebar=sidebar]").first()).toBeHidden();
});
