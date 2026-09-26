import { expect, test } from "@playwright/test";
import { violations } from "./axe";
import { ANALOGIES, ORG } from "./fixtures";

// WCAG 2.2 AA baseline: no serious or critical axe violations on the design gallery and the main
// pages, in the light theme and the dark one.

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
