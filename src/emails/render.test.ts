import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { renderEmail } = await import("./render");

const content = {
  preview: "Acme Ltd has invited you to Calibre.",
  sender: "Acme Ltd",
  heading: "Join Acme Ltd",
  paragraphs: ["Acme Ltd has invited you to Calibre."],
  quote: "Please finish before Friday's review.",
  action: { label: "Accept the invitation", url: "https://calibre.example/invite/abc" },
  notes: ["The link works for 7 days."],
};

describe("renderEmail", () => {
  it("renders the heading, the note, the button and the raw link in the HTML", async () => {
    const { html } = await renderEmail(content);
    expect(html).toContain("Join Acme Ltd");
    expect(html).toContain("Please finish before Friday&#x27;s review.");
    expect(html).toContain('href="https://calibre.example/invite/abc"');
    expect(html).toContain("The link works for 7 days.");
  });

  it("writes a plain-text part with the link spelled out", async () => {
    const { text } = await renderEmail(content);
    expect(text).toBe(
      [
        "Join Acme Ltd",
        "Acme Ltd has invited you to Calibre.",
        "Please finish before Friday's review.",
        "Accept the invitation: https://calibre.example/invite/abc",
        "The link works for 7 days.",
      ].join("\n\n"),
    );
  });

  it("leaves out an empty quote", async () => {
    const { text } = await renderEmail({ ...content, quote: undefined });
    expect(text).not.toContain("Friday");
  });
});
