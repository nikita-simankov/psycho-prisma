import type { Test, TestSubmission } from "@prisma/client";
import { answerQuality } from "./answer-quality";
import type { TestQuestion, TestQuestionResponse, TestScale } from "./constants";
import { byNotability, isNotable } from "./norms";
import { scoreSubmission, toScaleRows } from "./scoring";
import { assessValidity, validityScaleIds } from "./validity";

type ResultTest = Pick<Test, "id" | "name" | "strategy" | "scales" | "stanTable" | "tGradeTable" | "summaryTable" | "questions" | "organizationId" | "copiedFromId">;
type ResultSubmission = Pick<TestSubmission, "id" | "submission" | "summary" | "timings" | "locale" | "createdAt">;

function parseTimings(value: string): Record<string, number> {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

// Everything a results page shows for one submission. Scores are recomputed from the answers
// with the (localized) test passed in, so they follow its current tables and language.
export function buildTestResult(test: ResultTest, submission: ResultSubmission) {
  const responses = JSON.parse(submission.submission) as TestQuestionResponse[];
  const questions = JSON.parse(test.questions) as TestQuestion[];
  const scales = JSON.parse(test.scales) as TestScale[];
  const score = scoreSubmission(test, responses);
  const rows = toScaleRows(score?.result ?? (submission.summary ? JSON.parse(submission.summary) : []));
  const validityIds = validityScaleIds(scales);
  const scaleRows = rows.filter((row) => !validityIds.has(row.scaleId));
  const ordered = byNotability(scaleRows);

  return {
    id: submission.id,
    testId: test.id,
    testName: test.name,
    createdAt: submission.createdAt,
    questions,
    responses,
    validity: assessValidity(scales, responses, rows),
    // The shared library's norms (and copies of them) come from Russian samples; tests an
    // organization wrote itself make no such assumption.
    warnings: answerQuality(questions, responses, parseTimings(submission.timings), test.organizationId === null || test.copiedFromId ? submission.locale : ""),
    // Scale rows in the test's own order, for the profile.
    rows: scaleRows,
    // Scales outside the average band, most extreme first; then the rest.
    keyFindings: ordered.filter(isNotable),
    otherFindings: ordered.filter((row) => !isNotable(row)),
  };
}

export type TestResult = ReturnType<typeof buildTestResult>;

// Groups smaller than this are never shown, so no one's scores can be singled out.
export const MIN_GROUP = 5;

export type GroupAverage = {
  key: string;
  // Null for everyone in the organization.
  teamName: string | null;
  people: number;
  scales: { scaleId: number; scaleName: string; kind: "sten" | "t" | "raw"; average: number }[];
};

// Average scale scores per team and for the whole organization, from each person's latest result.
// Groups with fewer than MIN_GROUP people are left out.
export function groupAverages(
  results: { userId: string; teamId: string | null; rows: ReturnType<typeof toScaleRows> }[],
  teams: { id: string; name: string }[]
): GroupAverage[] {
  const average = (members: typeof results, key: string, teamName: string | null): GroupAverage | null => {
    if (members.length < MIN_GROUP) return null;
    const sums = new Map<number, { scaleName: string; kind: "sten" | "t" | "raw"; total: number; count: number }>();
    for (const member of members) {
      for (const row of member.rows) {
        const [kind, value] =
          row.stan !== null ? (["sten", row.stan] as const) : row.tGrade !== null ? (["t", row.tGrade] as const) : (["raw", row.correctedGrade ?? row.rawGrade] as const);
        if (value === null) continue;
        const entry = sums.get(row.scaleId) ?? { scaleName: row.scaleName, kind, total: 0, count: 0 };
        entry.total += value;
        entry.count += 1;
        sums.set(row.scaleId, entry);
      }
    }
    return {
      key,
      teamName,
      people: members.length,
      scales: Array.from(sums.entries())
        // A scale also needs enough people with a score.
        .filter(([, entry]) => entry.count >= MIN_GROUP)
        .map(([scaleId, entry]) => ({
          scaleId,
          scaleName: entry.scaleName,
          kind: entry.kind,
          average: Math.round((entry.total / entry.count) * 10) / 10,
        })),
    };
  };

  const groups = [average(results, "all", null)];
  for (const team of teams) {
    groups.push(average(results.filter((result) => result.teamId === team.id), team.id, team.name));
  }
  return groups.filter((group): group is GroupAverage => group !== null);
}
