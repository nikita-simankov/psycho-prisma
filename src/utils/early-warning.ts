import "server-only";

import { renderEmail } from "@/emails/render";
import { createTranslator } from "next-intl";
import { prisma } from "./database";
import { absoluteUrl, sendMail } from "./mail";
import { can } from "./roles";
import { detectAlerts, parseRules } from "./wellbeing";
import {
  leadershipRecipients,
  mailMessages,
  previousValues,
  roundHasTest,
  roundReadable,
  ruleLabel,
  ruleValues,
  wellbeingRounds,
  wellbeingScores,
} from "./wellbeing-scores";

const DAY = 24 * 60 * 60_000;
// Rounds older than this (and closed) are history: they serve as the previous period, but raise nothing.
const RECENT_DAYS = 60;

// Checks every team's wellbeing averages against the organization's rules and records an alert
// for each level crossed or sharp change for the worse. Teams with fewer than MIN_GROUP scores
// are never read. Returns how many new alerts were recorded; each is emailed once.
export async function runEarlyWarning(now = new Date()) {
  const since = new Date(now.getTime() - RECENT_DAYS * DAY);
  const organizations = await prisma.organization.findMany({
    where: { rounds: { some: { purpose: "wellbeing", OR: [{ createdAt: { gte: since } }, { closedAt: null }] } } },
    select: { id: true, wellbeingRules: true },
  });

  let recorded = 0;
  for (const organization of organizations) {
    recorded += await checkOrganization(organization, since, now);
  }
  await emailNewAlerts();
  return recorded;
}

async function checkOrganization(organization: { id: string; wellbeingRules: string }, since: Date, now: Date) {
  const rules = parseRules(organization.wellbeingRules).filter((rule) => rule.team !== null || rule.drop !== null);
  if (!rules.length) return 0;

  const testIds = Array.from(new Set(rules.map((rule) => rule.testId)));
  const [rounds, teams, tests] = await Promise.all([
    wellbeingRounds(organization.id),
    prisma.team.findMany({ where: { organizationId: organization.id }, select: { id: true } }),
    prisma.test.findMany({ where: { id: { in: testIds } }, select: { id: true, sensitive: true } }),
  ]);
  const scores = await wellbeingScores(organization.id, rounds, testIds);

  const data = [];
  for (const [index, round] of rounds.entries()) {
    if ((round.createdAt < since && round.closedAt) || !roundReadable(round, now)) continue;
    for (const rule of rules.filter((entry) => roundHasTest(round, entry.testId))) {
      for (const team of teams) {
        const current = ruleValues(scores, round.id, rule, team.id);
        const findings = detectAlerts(rule, current, previousValues(rounds, index, scores, rule, now, team.id));
        data.push(
          ...findings.map((finding) => ({
            organizationId: organization.id,
            roundId: round.id,
            teamId: team.id,
            ruleId: rule.id,
            label: rule.label,
            testId: rule.testId,
            scaleId: rule.scaleId,
            direction: rule.direction,
            sensitive: tests.find((test) => test.id === rule.testId)?.sensitive ?? false,
            ...finding,
          }))
        );
      }
    }
  }

  // The unique key (round, team, rule, kind) keeps an alert from being recorded twice.
  return data.length ? (await prisma.wellbeingAlert.createMany({ data, skipDuplicates: true })).count : 0;
}

// One email per organization with the alerts not yet sent, to its owners and admins. Alerts on
// clinical screens go only to those who may see them. The email names teams and scales, never scores.
async function emailNewAlerts() {
  const pending = await prisma.wellbeingAlert.findMany({
    where: { emailedAt: null, resolvedAt: null },
    include: { team: { select: { name: true } }, organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });
  const byOrganization = new Map<string, typeof pending>();
  for (const alert of pending) {
    byOrganization.set(alert.organizationId, [...(byOrganization.get(alert.organizationId) ?? []), alert]);
  }

  for (const alerts of Array.from(byOrganization.values())) {
    // Claim them first, so two runs never send the same alert.
    const claimed = await prisma.wellbeingAlert.updateMany({
      where: { id: { in: alerts.map((alert) => alert.id) }, emailedAt: null },
      data: { emailedAt: new Date() },
    });
    if (!claimed.count) continue;

    const organization = alerts[0].organization;
    const tests = await prisma.test.findMany({ where: { id: { in: alerts.map((alert) => alert.testId) } } });
    const link = await absoluteUrl(`/${organization.slug}/analytics`);
    for (const recipient of await leadershipRecipients(organization.id)) {
      const shown = alerts.filter((alert) => !alert.sensitive || can(recipient.role, "viewSensitive"));
      if (!shown.length) continue;
      const { locale, messages } = mailMessages(recipient.locale);
      const t = createTranslator({ locale, messages, namespace: "mail.alert" });
      const values = { organization: organization.name, count: shown.length };
      const content = await renderEmail({
        preview: t("preview", values),
        sender: organization.name,
        heading: t("heading", values),
        paragraphs: [
          t("greeting", { name: recipient.name }),
          ...shown.map((alert) => t(alert.kind === "drop" ? "drop" : "threshold", { team: alert.team.name, label: ruleLabel(alert, tests, locale) })),
          t("steps"),
        ],
        action: { label: t("action"), url: link },
        notes: [t("privacy")],
      });
      await sendMail({ to: recipient.email, subject: t("subject", values), ...content });
    }
  }
}
