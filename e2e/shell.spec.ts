import { expect, test } from "@playwright/test";
import { ORG } from "./fixtures";

// The app shell: the Today home page, the Library that joins tests and questionnaires, and the
// actions in the command palette.
test.use({ storageState: "e2e/.auth/owner.json" });

test("home greets the user and lists today's work", async ({ page }) => {
  await page.goto(`/${ORG}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Hello|Today/);
  await expect(page.getByRole("link", { name: /People/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overdue" })).toBeVisible();
});

test("the Library switches between tests and questionnaires", async ({ page }) => {
  await page.goto(`/${ORG}/tests`);
  const sidebarLibrary = page.getByRole("link", { name: "Library" });
  await expect(sidebarLibrary).toHaveAttribute("data-active", "true");
  const tabs = page.getByRole("navigation", { name: "Library sections" });
  await expect(tabs.getByRole("link", { name: "Tests" })).toHaveAttribute("aria-current", "page");
  await tabs.getByRole("link", { name: "Questionnaires" }).click();
  await expect(page).toHaveURL(new RegExp(`/${ORG}/forms$`));
  await expect(sidebarLibrary).toHaveAttribute("data-active", "true");
});

test("the command palette runs actions", async ({ page }) => {
  await page.goto(`/${ORG}`);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder(/Search/).fill("dark theme");
  await dialog.getByRole("option", { name: "Switch to the dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.keyboard.press("Control+k");
  await page.getByRole("dialog").getByPlaceholder(/Search/).fill("start a round");
  await page.getByRole("option", { name: "Start a round" }).click();
  await expect(page).toHaveURL(new RegExp(`/${ORG}/rounds/new$`));
});

test("settings are split into sections", async ({ page }) => {
  await page.goto(`/${ORG}/settings`);
  const sections = page.getByRole("navigation", { name: "Settings sections" });
  await expect(sections.getByRole("link", { name: "General" })).toHaveAttribute("aria-current", "page");
  await sections.getByRole("link", { name: "Members" }).click();
  await expect(page).toHaveURL(new RegExp(`/${ORG}/settings/members$`));
  await expect(page.getByRole("heading", { name: "Staff" })).toBeVisible();
  await sections.getByRole("link", { name: "Audit log" }).click();
  await expect(sections.getByRole("link", { name: "Audit log" })).toHaveAttribute("aria-current", "page");
  await sections.getByRole("link", { name: "Plan and billing" }).click();
  await expect(page.getByText("Early access")).toBeVisible();
});
