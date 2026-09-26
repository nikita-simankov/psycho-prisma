import { expect, test, type Locator } from "@playwright/test";

// Guards the design tokens: the gallery at /design renders both themes, and the key tokens resolve
// to the values the design system specifies. Pixel snapshots would differ between local and CI
// font rendering, so the checks read computed styles instead; a full-page screenshot is attached
// to every run for a visual look.
test.use({ storageState: "e2e/.auth/owner.json" });

const THEMES = {
  light: { page: "rgb(246, 244, 239)", surface: "rgb(255, 255, 255)", text: "rgb(26, 28, 33)", action: "rgb(43, 68, 214)" },
  dark: { page: "rgb(19, 20, 24)", surface: "rgb(27, 29, 34)", text: "rgb(236, 233, 226)", action: "rgb(142, 157, 255)" },
};

const style = (locator: Locator, property: string) =>
  locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

test("the design gallery shows every token in both themes", async ({ page }, testInfo) => {
  await page.goto("/design");
  await expect(page.getByRole("heading", { name: "Tokens and components" })).toBeVisible();

  for (const [theme, expected] of Object.entries(THEMES)) {
    const showcase = page.getByTestId(`showcase-${theme}`);
    await expect(showcase).toBeVisible();
    expect(await style(showcase, "background-color")).toBe(expected.page);
    expect(await style(showcase, "color")).toBe(expected.text);
    expect(await style(showcase.getByRole("button", { name: "Send round" }), "background-color")).toBe(expected.action);
    const actionSwatch = showcase.getByText("primary", { exact: true }).locator("xpath=../preceding-sibling::span");
    expect(await style(actionSwatch, "background-color")).toBe(expected.action);
    expect(await style(showcase.getByText("Q3 engagement round").locator("xpath=ancestor::*[contains(@class,'bg-card')][1]"), "background-color")).toBe(
      expected.surface,
    );
  }

  const light = page.getByTestId("showcase-light");
  expect(await style(light.getByRole("heading", { name: "Typography" }), "font-family")).toContain("Literata");
  expect(await style(light.getByText("Recent submissions"), "font-family")).toContain("Onest");
  expect(await style(light.getByText(/sten 7/), "font-family")).toMatch(/JetBrains.Mono/);
  expect(await style(light.getByRole("button", { name: "Send round" }), "border-top-left-radius")).toBe("4px");

  await testInfo.attach("design-gallery", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("the gallery needs a signed-in user", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/design");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await context.close();
});
