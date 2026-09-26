import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

// Serious and critical axe violations (contrast, names, roles) against WCAG 2.2 AA, one line each.
export async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).slice(0, 5).join(", ")}`);
}
