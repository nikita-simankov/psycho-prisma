import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ORG } from "./fixtures";

// WCAG 2.2 AA baseline: no serious or critical axe violations (contrast, names, roles) on the
// design gallery and the main pages, in the light theme and the dark one.
async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).slice(0, 5).join(", ")}`);
}

test.describe("signed in", () => {
  test.use({ storageState: "e2e/.auth/owner.json" });

  for (const path of ["/design", `/${ORG}`, `/${ORG}/people`, `/${ORG}/analytics`, `/${ORG}/settings`]) {
    for (const theme of ["light", "dark"] as const) {
      test(`${path} in the ${theme} theme has no serious accessibility issues`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        expect(await violations(page)).toEqual([]);
      });
    }
  }
});

test("sign-in has no serious accessibility issues", async ({ page }) => {
  await page.goto("/auth/sign-in");
  expect(await violations(page)).toEqual([]);
});
