import { expect, test } from "@playwright/test";
import { violations } from "./axe";

// The public site: every page answers, is indexable, and has no serious accessibility issues.

const PAGES = [
  "/",
  "/product",
  "/pricing",
  "/instruments",
  "/instruments/analogies",
  "/security",
  "/legal",
  "/legal/terms",
  "/legal/dpa",
  "/legal/subprocessors",
  "/legal/refunds",
];

for (const path of PAGES) {
  for (const theme of ["light", "dark"] as const) {
    test(`${path} in the ${theme} theme is public and accessible`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["x-robots-tag"]).toBeUndefined();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`${path === "/" ? "" : path}$`));
      expect(await violations(page)).toEqual([]);
    });
  }
}

test("pricing lists the four plans and a comparison", async ({ page }) => {
  await page.goto("/pricing");
  for (const plan of ["Free", "Team", "Business", "Enterprise"]) {
    await expect(page.getByRole("columnheader", { name: plan })).toBeVisible();
  }
  await expect(page.getByRole("rowheader", { name: "Clinical instruments for psychologists" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Refund policy" })).toHaveAttribute("href", "/legal/refunds");
});

test("the site navigation reaches every section", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" }).first();
  for (const [name, path] of [
    ["Product", "/product"],
    ["Instruments", "/instruments"],
    ["Pricing", "/pricing"],
    ["Security", "/security"],
  ]) {
    await nav.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await page.goto("/");
  }
});

test("instrument pages exist only for the public library", async ({ page }) => {
  await page.goto("/instruments");
  await page.getByRole("link", { name: /Leadership/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Leadership" })).toBeVisible();
  expect((await page.goto("/instruments/beck-depression"))?.status()).toBe(404);
});

test("the sitemap lists the site, the library and the legal pages", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/pricing", "/instruments/analogies", "/legal/dpa", "/security"]) {
    expect(sitemap).toContain(`${path}</loc>`);
  }
});

test("the site reads in Russian", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "NEXT_LOCALE", value: "ru", url: baseURL! }]);
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Платите за тех, кого оцениваете, а не за места");
});
