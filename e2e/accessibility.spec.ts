import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ANALOGIES, ORG } from "./fixtures";

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

// The respondent side: the to-do list as a member sees it, and an instrument's start page and runner
// (staff may open any instrument; members only the ones sent to them).
const RESPONDENT_PAGES = [
  { path: "/assessments", state: "e2e/.auth/member.json" },
  { path: `/tests/${ANALOGIES}`, state: "e2e/.auth/owner.json" },
  { path: `/tests/${ANALOGIES}/run`, state: "e2e/.auth/owner.json" },
];

for (const { path, state } of RESPONDENT_PAGES) {
  test.describe(path, () => {
    test.use({ storageState: state });

    for (const theme of ["light", "dark"] as const) {
      test(`${path} in the ${theme} theme has no serious accessibility issues`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("main")).toBeVisible();
        expect(await violations(page)).toEqual([]);
      });
    }
  });
}

for (const path of ["/auth/sign-in", "/auth/sign-up"]) {
  for (const theme of ["light", "dark"] as const) {
    test(`${path} in the ${theme} theme has no serious accessibility issues`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      await page.goto(path);
      expect(await violations(page)).toEqual([]);
    });
  }
}
