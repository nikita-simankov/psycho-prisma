import "server-only";

import {
  distributions,
  latestPerPerson,
  participation,
  quarterlyAverages,
  type AnalyticsEntry,
} from "@/utils/analytics";
import type { Filters } from "@/utils/analytics-filters";
import type { Context } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { buildTestResult, groupAverages } from "@/utils/results";
import { can } from "@/utils/roles";
import { getLocale } from "next-intl/server";

const DAY = 24 * 60 * 60 * 1000;
const ROUND_LIMIT = 12;

// Aggregates for the analytics page. Everything here is a group figure: groups smaller than
// MIN_GROUP are dropped in the helpers, and restricted instruments only reach roles that may see them.
export async function loadAnalytics(context: Context, filters: Filters) {
  const organizationId = context.organization.id;
  const locale = await getLocale();
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : undefined;
  const to = filters.to ? new Date(new Date(`${filters.to}T00:00:00`).getTime() + DAY) : undefined;
  const createdAt = from || to ? { ...(from && { gte: from }), ...(to && { lt: to }) } : undefined;

  const [memberships, teams, rounds, tests] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId, role: { not: "candidate" } },
      select: { userId: true, teamId: true, position: true },
    }),
    prisma.team.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.round.findMany({ where: { organizationId }, select: { id: true, name: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.test.findMany({
      where: { AND: [libraryWhere(organizationId)], ...(!can(context.membership.role, "viewSensitive") && { sensitive: false }) },
    }),
  ]);

  const positions = Array.from(new Set(memberships.map((member) => member.position).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const population = memberships.filter(
    (member) => (!filters.team || member.teamId === filters.team) && (!filters.position || member.position === filters.position)
  );
  const teamOf = new Map(population.map((member) => [member.userId, member.teamId]));
  const shownTeams = teams.filter((team) => !filters.team || team.id === filters.team);
  const round = rounds.find((entry) => entry.id === filters.round);

  // Participation: assignments of the people in view, per round and per team.
  const assignments = (
    await prisma.assignment.findMany({
      where: { round: { organizationId, ...(round && { id: round.id }), ...(createdAt && { createdAt }) } },
      select: { id: true, userId: true, roundId: true, completedAt: true },
    })
  ).filter((assignment) => teamOf.has(assignment.userId));

  const byRound = rounds
    .filter((entry) => assignments.some((assignment) => assignment.roundId === entry.id))
    .slice(0, ROUND_LIMIT)
    .reverse()
    .map((entry) => ({ id: entry.id, name: entry.name, value: participation(assignments.filter((assignment) => assignment.roundId === entry.id)) }));
  const byTeam = shownTeams.map((team) => ({
    id: team.id,
    name: team.name,
    value: participation(assignments.filter((assignment) => teamOf.get(assignment.userId) === team.id)),
  }));

  // Scores: submissions of the chosen instrument by people in view.
  const testIds = new Set(tests.map((test) => test.id));
  const submissions = (
    await prisma.testSubmission.findMany({
      where: {
        organizationId,
        testId: { in: Array.from(testIds) },
        ...(createdAt && { createdAt }),
        ...(round && { assignmentId: { in: assignments.map((assignment) => assignment.id) } }),
      },
      orderBy: { createdAt: "asc" },
    })
  ).filter((submission) => teamOf.has(submission.userId));

  const counts = new Map<string, number>();
  for (const submission of submissions) counts.set(submission.testId, (counts.get(submission.testId) ?? 0) + 1);
  const available = tests
    .filter((test) => counts.has(test.id))
    .map((test) => localizeTest(test, locale))
    .sort((a, b) => a.name.localeCompare(b.name));
  const test =
    available.find((entry) => entry.id === filters.test) ??
    available.slice().sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))[0] ??
    null;

  const entries: AnalyticsEntry[] = test
    ? submissions
        .filter((submission) => submission.testId === test.id)
        .map((submission) => ({
          userId: submission.userId,
          teamId: teamOf.get(submission.userId) ?? null,
          createdAt: submission.createdAt,
          rows: buildTestResult(test, submission).rows,
        }))
    : [];
  const latest = latestPerPerson(entries);

  return {
    options: {
      teams,
      positions,
      rounds: rounds.map((entry) => ({ id: entry.id, name: entry.name })),
      tests: available.map((entry) => ({ id: entry.id, name: entry.name })),
    },
    test: test && { id: test.id, name: test.name, people: latest.length },
    participation: { byRound, byTeam, assigned: assignments.length },
    distributions: distributions(entries),
    heatmap: groupAverages(latest, shownTeams),
    quarters: quarterlyAverages(entries),
  };
}

export type Analytics = Awaited<ReturnType<typeof loadAnalytics>>;
