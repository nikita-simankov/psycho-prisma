import "server-only";

import { renderEmail } from "@/emails/render";
import { createTranslator } from "next-intl";
import { audit } from "./audit";
import { prisma } from "./database";
import { absoluteUrl, sendMail } from "./mail";
import type { ScaleRow } from "./scoring";
import { parseRules, parseSupportLinks, personCrossings, type Support } from "./wellbeing";
import { mailMessages } from "./wellbeing-scores";

// Duty of care after a screening: when someone's result crosses a rule's personal level they see
// the organization's support resources at once, and (unless the round is anonymous) a
// psychologist is asked to check in with them.

export async function supportFor(organizationId: string): Promise<Support> {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { supportText: true, supportContacts: true, supportLinks: true },
  });
  return { text: organization.supportText, contacts: organization.supportContacts, links: parseSupportLinks(organization.supportLinks) };
}

export type CareFlagReason = { ruleId: string; label: string; scaleId: number }[];

export function parseCareReason(json: string): CareFlagReason {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Checks a scored result against the rules. Returns the support to show, or null when no rule
// was crossed. `userId` is null for anonymous answers: they get the support but raise no flag.
export async function careCheck(input: {
  organization: { id: string; name: string; slug: string };
  userId: string | null;
  testId: string;
  submissionId: string | null;
  rows: ScaleRow[];
}): Promise<Support | null> {
  const { wellbeingRules } = await prisma.organization.findUniqueOrThrow({
    where: { id: input.organization.id },
    select: { wellbeingRules: true },
  });
  const crossed = personCrossings(parseRules(wellbeingRules), input.testId, input.rows);
  if (!crossed.length) return null;

  if (input.userId && input.submissionId) {
    await raiseCareFlag(input.organization, input.userId, input.testId, input.submissionId, crossed.map(({ id, label, scaleId }) => ({ ruleId: id, label, scaleId })));
  }
  return supportFor(input.organization.id);
}

async function raiseCareFlag(
  organization: { id: string; name: string; slug: string },
  userId: string,
  testId: string,
  submissionId: string,
  reason: CareFlagReason
) {
  // One open request per person and test is enough; a retake doesn't add another.
  const open = await prisma.careFlag.findFirst({ where: { organizationId: organization.id, userId, testId, resolvedAt: null } });
  if (open) return;

  await prisma.careFlag.create({
    data: { organizationId: organization.id, userId, testId, submissionId, reason: JSON.stringify(reason) },
  });
  await audit(organization.id, null, "raiseCareFlag", { subjectId: userId, detail: { testId } });
  await emailPsychologists(organization);
}

// Tells the psychologists (or, without any, the owners) that a check-in is waiting. The email
// names nobody and holds no scores: they see who and why in Calibre.
async function emailPsychologists(organization: { id: string; name: string; slug: string }) {
  const find = (role: string) =>
    prisma.membership.findMany({
      where: { organizationId: organization.id, role, user: { email: { not: null } } },
      select: { user: { select: { email: true, name: true, locale: true } } },
    });
  const psychologists = await find("psychologist");
  const recipients = psychologists.length ? psychologists : await find("owner");
  const link = await absoluteUrl(`/${organization.slug}/people/follow-up`);

  for (const { user } of recipients) {
    const { locale, messages } = mailMessages(user.locale);
    const t = createTranslator({ locale, messages, namespace: "mail.care" });
    const values = { organization: organization.name, name: user.name };
    const content = await renderEmail({
      preview: t("preview", values),
      sender: organization.name,
      heading: t("heading"),
      paragraphs: [t("greeting", values), t("text", values), t("next")],
      action: { label: t("action"), url: link },
      notes: [t("privacy")],
    });
    await sendMail({ to: user.email!, subject: t("subject", values), ...content });
  }
}
