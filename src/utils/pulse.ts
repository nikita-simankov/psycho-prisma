import "server-only";

import type { Test } from "@prisma/client";
import { localizeTest } from "./content-translation";
import { prisma } from "./database";
import { toScaleRows, type ScaleRow } from "./scoring";
import { pulseGroups } from "./wellbeing";

// Anonymous pulse rounds. The answer and the person's progress are stored apart: a PulseResponse
// with the answers and the team but no person, assignment or time, and a PulseReceipt on the
// assignment that says only which item is done. Nothing joins the two.

export async function recordPulseAnswer(input: {
  organizationId: string;
  roundId: string;
  assignmentId: string;
  teamId: string | null;
  test: Pick<Test, "id" | "version">;
  summary: string;
  submission: string;
}) {
  await prisma.$transaction([
    prisma.pulseResponse.create({
      data: {
        organizationId: input.organizationId,
        roundId: input.roundId,
        teamId: input.teamId,
        testId: input.test.id,
        testVersion: input.test.version,
        summary: input.summary,
        submission: input.submission,
      },
    }),
    prisma.pulseReceipt.upsert({
      where: { assignmentId_item: { assignmentId: input.assignmentId, item: `test:${input.test.id}` } },
      create: { assignmentId: input.assignmentId, item: `test:${input.test.id}` },
      update: {},
    }),
  ]);
}

function rowsOf(summary: string): ScaleRow[] {
  try {
    return toScaleRows(JSON.parse(summary));
  } catch {
    return [];
  }
}

// Team and organization averages per test of an anonymous round. Groups under MIN_GROUP are
// returned as hidden, so pages show the privacy mask instead.
export async function pulseResults(round: { id: string; organizationId: string }, tests: Test[], locale: string) {
  const [responses, teams] = await Promise.all([
    prisma.pulseResponse.findMany({
      where: { roundId: round.id, organizationId: round.organizationId, testId: { in: tests.map((test) => test.id) } },
      select: { id: true, teamId: true, testId: true, summary: true },
    }),
    prisma.team.findMany({ where: { organizationId: round.organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return tests.map((test) => {
    const localized = localizeTest(test, locale);
    // Scale names in the reader's language rather than the one the answers were given in.
    const names = new Map((JSON.parse(localized.scales) as { id: number; name: string }[]).map((scale) => [scale.id, scale.name]));
    const own = responses
      .filter((response) => response.testId === test.id)
      .map((response) => ({
        id: response.id,
        teamId: response.teamId,
        rows: rowsOf(response.summary).map((row) => ({ ...row, scaleName: names.get(row.scaleId) ?? row.scaleName })),
      }));
    return { testId: test.id, name: localized.name, responses: own.length, ...pulseGroups(own, teams) };
  });
}
