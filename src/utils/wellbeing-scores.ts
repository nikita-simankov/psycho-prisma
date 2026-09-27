import "server-only";

import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import type { Test } from "@prisma/client";
import { localizeTest } from "./content-translation";
import { prisma } from "./database";
import { MIN_GROUP } from "./results";
import { toScaleRows, type ScaleRow } from "./scoring";
import { pulseResultsReady, scoreValue, type WellbeingRule } from "./wellbeing";

// Scores from wellbeing rounds, as the early warning and the leadership digest read them: one
// entry per answered test, with the team the person is in (or, for anonymous rounds, was in).

export type WellbeingRound = { id: string; name: string; anonymous: boolean; items: string; createdAt: Date; closedAt: Date | null; dueAt: Date | null };
export type WellbeingScore = { roundId: string; teamId: string | null; testId: string; rows: ScaleRow[] };

function parseRows(summary: string): ScaleRow[] {
  try {
    return toScaleRows(JSON.parse(summary));
  } catch {
    return [];
  }
}

export function roundHasTest(round: Pick<WellbeingRound, "items">, testId: string) {
  try {
    return (JSON.parse(round.items) as { kind: string; id: string }[]).some((item) => item.kind === "test" && item.id === testId);
  } catch {
    return false;
  }
}

// Whether a round's scores may be read yet: anonymous rounds wait until they close or pass due.
export function roundReadable(round: WellbeingRound, now: Date) {
  return !round.anonymous || pulseResultsReady(round, now);
}

// The organization's wellbeing rounds, oldest first.
export function wellbeingRounds(organizationId: string) {
  return prisma.round.findMany({
    where: { organizationId, purpose: "wellbeing" },
    select: { id: true, name: true, anonymous: true, items: true, createdAt: true, closedAt: true, dueAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function wellbeingScores(organizationId: string, rounds: WellbeingRound[], testIds: string[]): Promise<WellbeingScore[]> {
  const named = rounds.filter((round) => !round.anonymous).map((round) => round.id);
  const anonymous = rounds.filter((round) => round.anonymous).map((round) => round.id);
  const [assignments, pulses, memberships] = await Promise.all([
    prisma.assignment.findMany({ where: { roundId: { in: named } }, select: { id: true, roundId: true, userId: true } }),
    prisma.pulseResponse.findMany({
      where: { organizationId, roundId: { in: anonymous }, testId: { in: testIds } },
      select: { roundId: true, teamId: true, testId: true, summary: true },
    }),
    prisma.membership.findMany({ where: { organizationId, role: { not: "candidate" } }, select: { userId: true, teamId: true } }),
  ]);
  const submissions = await prisma.testSubmission.findMany({
    where: { organizationId, testId: { in: testIds }, assignmentId: { in: assignments.map((assignment) => assignment.id) } },
    select: { assignmentId: true, testId: true, summary: true },
  });
  const assignmentOf = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const teamOf = new Map(memberships.map((member) => [member.userId, member.teamId]));

  return [
    ...submissions.flatMap((submission) => {
      const assignment = assignmentOf.get(submission.assignmentId ?? "");
      // People who left are no longer part of any team picture.
      if (!assignment || !teamOf.has(assignment.userId)) return [];
      return [{ roundId: assignment.roundId, teamId: teamOf.get(assignment.userId) ?? null, testId: submission.testId, rows: parseRows(submission.summary) }];
    }),
    ...pulses.map((pulse) => ({ roundId: pulse.roundId, teamId: pulse.teamId, testId: pulse.testId, rows: parseRows(pulse.summary) })),
  ];
}

// One rule's values in a round, for a team or (teamId undefined) everyone.
export function ruleValues(scores: WellbeingScore[], roundId: string, rule: Pick<WellbeingRule, "testId" | "scaleId">, teamId?: string) {
  return scores.flatMap((score) => {
    if (score.roundId !== roundId || score.testId !== rule.testId || (teamId !== undefined && score.teamId !== teamId)) return [];
    const row = score.rows.find((entry) => entry.scaleId === rule.scaleId);
    const value = row ? scoreValue(row) : null;
    return value === null ? [] : [value];
  });
}

// The latest readable round before `index` with enough values for the rule, if any.
export function previousValues(
  rounds: WellbeingRound[],
  index: number,
  scores: WellbeingScore[],
  rule: Pick<WellbeingRule, "testId" | "scaleId">,
  now: Date,
  teamId?: string
) {
  for (let i = index - 1; i >= 0; i--) {
    if (!roundHasTest(rounds[i], rule.testId) || !roundReadable(rounds[i], now)) continue;
    const values = ruleValues(scores, rounds[i].id, rule, teamId);
    if (values.length >= MIN_GROUP) return values;
  }
  return null;
}

// What a rule is called: its own label, or the scale's name in the reader's language.
export function ruleLabel(
  rule: { label: string; testId: string; scaleId: number },
  tests: Test[],
  locale: string
) {
  if (rule.label) return rule.label;
  const test = tests.find((entry) => entry.id === rule.testId);
  if (!test) return "";
  const localized = localizeTest(test, locale);
  const scale = (JSON.parse(localized.scales) as { id: number; name: string }[]).find((entry) => entry.id === rule.scaleId);
  return scale?.name ?? localized.name;
}

// The language an email goes out in: the person's own, the server's mail default, or English.
export function mailMessages(locale: string): { locale: Locale; messages: typeof en } {
  const chosen: Locale = isLocale(locale) ? locale : isLocale(process.env.MAIL_LOCALE) ? process.env.MAIL_LOCALE : DEFAULT_LOCALE;
  return { locale: chosen, messages: chosen === "ru" ? ru : en };
}

// Owners and admins, who get early warnings and the digest; each with whether they may see clinical screens.
export async function leadershipRecipients(organizationId: string) {
  const memberships = await prisma.membership.findMany({
    where: { organizationId, role: { in: ["owner", "admin"] }, user: { email: { not: null } } },
    select: { role: true, user: { select: { email: true, name: true, locale: true } } },
  });
  return memberships.map((membership) => ({ role: membership.role, email: membership.user.email!, name: membership.user.name, locale: membership.user.locale }));
}
