import "server-only";

import { renderEmail } from "@/emails/render";
import { createTranslator } from "next-intl";
import { prisma } from "./database";
import { absoluteUrl, sendMail } from "./mail";
import { MIN_GROUP } from "./results";
import { can } from "./roles";
import { digestDue, digestSummary, groupMean, parseRules, type ActionStatus, type AlertKind, type DigestInput, type DigestSummary } from "./wellbeing";
import {
  leadershipRecipients,
  mailMessages,
  roundHasTest,
  roundReadable,
  ruleLabel,
  ruleValues,
  wellbeingRounds,
  wellbeingScores,
} from "./wellbeing-scores";

const WEEK = 7 * 24 * 60 * 60_000;

// The figures behind one week's leadership digest. Group figures only: participation counts,
// organization-wide averages of MIN_GROUP or more people, open alerts and team actions.
// Clinical screens are left out for readers who may not see them.
export async function digestInput(organizationId: string, sensitive: boolean, locale: string, now = new Date()): Promise<DigestInput> {
  const weekAgo = new Date(now.getTime() - WEEK);
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { wellbeingRules: true } });
  const [assignments, alerts, actions, rounds] = await Promise.all([
    prisma.assignment.findMany({
      where: { round: { organizationId, OR: [{ closedAt: null }, { closedAt: { gte: weekAgo } }] }, invitedAt: { not: null } },
      select: { completedAt: true },
    }),
    prisma.wellbeingAlert.findMany({
      where: { organizationId, resolvedAt: null, ...(!sensitive && { sensitive: false }) },
      include: { team: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamAction.findMany({
      where: { organizationId, updatedAt: { gte: weekAgo } },
      include: { team: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    wellbeingRounds(organizationId),
  ]);

  const allRules = parseRules(organization.wellbeingRules);
  const tests = await prisma.test.findMany({ where: { id: { in: allRules.map((rule) => rule.testId) } } });
  const rules = allRules.filter((rule) => sensitive || !tests.find((test) => test.id === rule.testId)?.sensitive);
  const scores = await wellbeingScores(organizationId, rounds, Array.from(new Set(rules.map((rule) => rule.testId))));

  const trends = rules.flatMap((rule) => {
    // The latest two readable rounds with enough people on this rule.
    const readings = rounds
      .filter((round) => roundHasTest(round, rule.testId) && roundReadable(round, now))
      .map((round) => ruleValues(scores, round.id, rule))
      .filter((values) => values.length >= MIN_GROUP);
    const current = readings.at(-1);
    if (!current) return [];
    const previous = readings.at(-2);
    return [
      {
        label: ruleLabel(rule, tests, locale),
        direction: rule.direction,
        current: groupMean(current)!,
        previous: previous ? groupMean(previous) : null,
        people: current.length,
      },
    ];
  });

  return {
    assigned: assignments.length,
    completed: assignments.filter((assignment) => assignment.completedAt).length,
    completedThisWeek: assignments.filter((assignment) => assignment.completedAt && assignment.completedAt >= weekAgo).length,
    trends,
    alerts: alerts.map((alert) => ({ team: alert.team.name, label: ruleLabel(alert, tests, locale), kind: alert.kind as AlertKind })),
    actions: actions.map((action) => ({ team: action.team?.name ?? null, text: action.text, status: action.status as ActionStatus })),
  };
}

// The digest email in the reader's language.
export async function digestEmail(organization: { name: string; slug: string }, recipient: { name: string; locale: string }, summary: DigestSummary) {
  const { locale, messages } = mailMessages(recipient.locale);
  const t = createTranslator({ locale, messages, namespace: "mail.digest" });
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const { participation, trends, alerts, actions } = summary;

  const paragraphs = [
    t("greeting", { name: recipient.name }),
    participation.percent === null
      ? t("noRounds")
      : t("participation", { completed: participation.completed, assigned: participation.assigned, percent: participation.percent, week: participation.thisWeek }),
    trends.length ? t("trendsTitle") : t("noTrends", { min: MIN_GROUP }),
    ...trends.map((trend) =>
      trend.previous === null
        ? t("trendNew", { label: trend.label, value: number(trend.current) })
        : t("trend", { label: trend.label, value: number(trend.current), previous: number(trend.previous), trend: trend.trend })
    ),
    alerts.length ? t("alertsTitle", { count: alerts.length }) : t("noAlerts"),
    ...alerts.map((alert) => t(alert.kind === "drop" ? "alertDrop" : "alertThreshold", { team: alert.team, label: alert.label })),
    actions.items.length ? t("actionsTitle", { done: actions.done, inProgress: actions.inProgress, planned: actions.planned }) : t("noActions"),
    ...actions.items.slice(0, 10).map((action) => t("action", { team: action.team ?? t("everyone"), text: action.text, status: action.status })),
  ];

  const content = await renderEmail({
    preview: t("preview", { organization: organization.name }),
    sender: organization.name,
    heading: t("heading", { organization: organization.name }),
    paragraphs,
    action: { label: t("open"), url: await absoluteUrl(`/${organization.slug}`) },
    notes: [t("privacy", { min: MIN_GROUP }), t("settings")],
  });
  return { subject: t("subject", { organization: organization.name }), ...content };
}

// Builds this week's digest for one reader.
export async function buildDigest(
  organization: { id: string; name: string; slug: string },
  recipient: { name: string; locale: string; role: string },
  now = new Date()
) {
  const { locale } = mailMessages(recipient.locale);
  const summary = digestSummary(await digestInput(organization.id, can(recipient.role, "viewSensitive"), locale, now));
  return { summary, email: await digestEmail(organization, recipient, summary) };
}

// Sends the weekly digest to owners and admins of organizations whose digest day it is.
// Returns how many organizations it went out for.
export async function runDigests(now = new Date()) {
  const organizations = await prisma.organization.findMany({
    where: { digestEnabled: true, isSample: false },
    select: { id: true, name: true, slug: true, digestWeekday: true, digestSentAt: true, timeZone: true },
  });
  let sent = 0;

  for (const organization of organizations) {
    if (!digestDue(now, organization.digestWeekday, organization.digestSentAt, organization.timeZone)) continue;
    // Claim the week first, so two runs never send it twice.
    const claimed = await prisma.organization.updateMany({
      where: { id: organization.id, digestSentAt: organization.digestSentAt },
      data: { digestSentAt: now },
    });
    if (!claimed.count) continue;

    for (const recipient of await leadershipRecipients(organization.id)) {
      const { summary, email } = await buildDigest(organization, recipient, now);
      // A quiet week with nothing to report sends nothing.
      if (!summary.empty) await sendMail({ to: recipient.email, ...email });
    }
    sent += 1;
  }

  return sent;
}
