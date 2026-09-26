import { expect, test } from "@playwright/test";

test("the landing page is public and indexable", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["x-robots-tag"]).toBeUndefined();
  await expect(page.locator("link[rel=canonical]")).toHaveCount(1);
  await expect(page.locator("script[type='application/ld+json']")).toHaveCount(1);
});

test("robots.txt and the sitemap point at the public pages", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/privacy</loc>");
});

test("private pages send visitors to sign in and are not indexed", async ({ page }) => {
  const response = await page.request.get("/assessments", { maxRedirects: 0 });
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  await page.goto("/assessments");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test("a wrong password is refused", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill("nobody@acme.test");
  await page.locator("input[type=password]").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await expect(page.getByText("Wrong email or password", { exact: true })).toBeVisible();
});

test("the interface follows the language cookie", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "NEXT_LOCALE", value: "ru", url: baseURL! }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});

test("the health check answers", async ({ request }) => {
  expect((await request.get("/api/health")).ok()).toBe(true);
});
