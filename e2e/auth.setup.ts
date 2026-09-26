import { expect, test as setup } from "@playwright/test";
import { MEMBER, OWNER, PASSWORD } from "./fixtures";

// Signs in once per role and saves the session; sign-in is rate limited, so specs reuse these.
for (const [email, file] of [
  [OWNER, "e2e/.auth/owner.json"],
  [MEMBER, "e2e/.auth/member.json"],
]) {
  setup(`sign in as ${email}`, async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.locator("input[type=password]").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).last().click();
    await page.waitForURL((url) => !url.pathname.startsWith("/auth"));
    await expect(page.locator("main")).toBeVisible();
    await page.context().storageState({ path: file });
  });
}
