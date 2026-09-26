import "server-only";

import { render } from "@react-email/components";
import { CalibreEmail, type EmailContent } from "./calibre-email";

// The HTML part of an email, and a plain-text part built from the same content.
export async function renderEmail(content: EmailContent) {
  const html = await render(<CalibreEmail {...content} />);
  const text = [
    content.heading,
    ...content.paragraphs,
    content.quote ?? "",
    `${content.action.label}: ${content.action.url}`,
    ...content.notes,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
}
