import "server-only";

import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import { renderEmail } from "@/emails/render";
import { mailLocale } from "@/i18n/config";
import { createTranslator } from "next-intl";
import type { Strength } from "./candidate-feedback";
import { localizeTest } from "./content-translation";
import { prisma } from "./database";
import { testsAsAnswered } from "./instrument-versions";
import { libraryWhere } from "./library";
import { buildTestResult } from "./results";
import { parseTargetBands } from "./target-profiles";

// Server helpers for hiring: target profiles, who counts as a candidate, the results a share link
// or feedback email may draw on, and the feedback email itself.

export async function loadTargetProfiles(organizationId: string, testId: string) {
  const profiles = await prisma.targetProfile.findMany({ where: { organizationId, testId }, orderBy: { updatedAt: "desc" } });
  return profiles.map((profile) => ({ id: profile.id, name: profile.name, bands: parseTargetBands(profile.scales), updatedAt: profile.updatedAt }));
}

export type LoadedTargetProfile = Awaited<ReturnType<typeof loadTargetProfiles>>[number];

// "none" in the URL turns targets off.
export const NO_TARGET = "none";

// The profile a page reads results against: the one in the URL, none when asked, otherwise the
// most recently changed one.
export function chooseTarget(profiles: LoadedTargetProfile[], requested: string | undefined) {
  if (requested === NO_TARGET) return null;
  return profiles.find((profile) => profile.id === requested) ?? profiles[0] ?? null;
}

// Someone who took part in one of the organization's hiring rounds. Only their reports can be
// shared outside Calibre, and only they get strengths feedback.
export async function isHiringCandidate(organizationId: string, userId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { userId, round: { organizationId, purpose: "hiring" } },
    select: { id: true },
  });
  return assignment !== null;
}

// A person's test results that may leave the dashboard: never clinical or wellbeing screens, and
// only the latest per test unless exact submissions are given. Oldest first.
export async function shareableResults(organizationId: string, userId: string, locale: string, submissionIds?: string[]) {
  const sensitive = await prisma.test.findMany({ where: { sensitive: true }, select: { id: true } });
  const submissions = await prisma.testSubmission.findMany({
    where: {
      organizationId,
      userId,
      testId: { notIn: sensitive.map((test) => test.id) },
      ...(submissionIds ? { id: { in: submissionIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  // Newest first, so the first one seen per test is the latest.
  const seen = new Set<string>();
  const chosen = submissionIds
    ? submissions
    : submissions.filter((submission) => !seen.has(submission.testId) && Boolean(seen.add(submission.testId)));

  const tests = await prisma.test.findMany({
    where: { id: { in: chosen.map((submission) => submission.testId) }, sensitive: false, AND: [libraryWhere(organizationId)] },
  });
  const testFor = await testsAsAnswered(tests, chosen);

  return chosen
    .flatMap((submission) => {
      const answered = testFor(submission);
      return answered ? [buildTestResult(localizeTest(answered, locale), submission)] : [];
    })
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function translatorFor(locale: string) {
  const chosen = mailLocale(locale);
  return createTranslator({ locale: chosen, messages: chosen === "ru" ? ru : en, namespace: "mail.feedback" });
}

// The feedback email as the candidate will read it, in their language. The preview shows exactly this.
export async function feedbackEmail(
  recipient: { name: string; locale: string },
  organization: string,
  strengths: Pick<Strength, "scaleName" | "level">[],
  note: string
) {
  const t = translatorFor(recipient.locale);
  const values = { organization, name: recipient.name };
  const paragraphs = [
    t("thanks", values),
    ...(strengths.length
      ? [t("intro"), ...strengths.map((strength) => t(strength.level === "marked" ? "marked" : "clear", { scale: strength.scaleName }))]
      : [t("noStrengths", values)]),
    t("closing", values),
  ];
  const content = {
    preview: t("preview", values),
    sender: organization,
    heading: t("heading", values),
    paragraphs,
    quote: note || undefined,
    notes: [t("aboutSummary")],
  };
  return { subject: t("subject", values), content, ...(await renderEmail(content)) };
}
