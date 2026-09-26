import type { Test, TestSubmission } from "@prisma/client";
import { answerQuality, qualityScore } from "./answer-quality";
import type { SummaryTableRow, TestQuestion, TestQuestionResponse, TestScale } from "./constants";
import { applyOrgNorms, bandReadings, byNotability, isNotable, type Band, type OrgNorms } from "./norms";
import { reliabilityOf } from "./psychometrics";
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

export type ScaleInfo = {
  description: string | null;
  // The test's own reading of a low, average and high score, where it has one.
  readings: Partial<Record<Band, string>>;
  reliability: number;
  // True when the scale states no reliability and the default was used.
  assumed: boolean;
};

function parseArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// What the "What does this mean?" note and the error band need to know about each scale.
export function scaleInfo(scales: TestScale[], summaryTable: SummaryTableRow[], strategy: string): Record<number, ScaleInfo> {
  const kind = strategy === "t-grade" ? "t" : strategy === "standard-ten" ? "sten" : null;
  return Object.fromEntries(
    scales.map((scale) => {
      const { alpha, assumed } = reliabilityOf(scale);
      return [
        scale.id,
        {
          description: scale.description?.trim() || null,
          readings: kind ? bandReadings(summaryTable, scale.id, kind) : {},
          reliability: alpha,
          assumed,
        },
      ];
    })
  );
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
  // The shared library's norms (and copies of them) come from Russian samples; tests an
  // organization wrote itself make no such assumption.
  const warnings = answerQuality(questions, responses, parseTimings(submission.timings), test.organizationId === null || test.copiedFromId ? submission.locale : "");

  return {
    id: submission.id,
    testId: test.id,
    testName: test.name,
    createdAt: submission.createdAt,
    questions,
    responses,
    validity: assessValidity(scales, responses, rows),
    warnings,
    quality: qualityScore(warnings, questions.length),
    info: scaleInfo(scales, parseArray<SummaryTableRow>(test.summaryTable), test.strategy),
    // Scale rows in the test's own order, for the profile.
    rows: scaleRows,
    // Scales outside the average band, most extreme first; then the rest.
    keyFindings: ordered.filter(isNotable),
    otherFindings: ordered.filter((row) => !isNotable(row)),
  };
}

export type TestResult = ReturnType<typeof buildTestResult>;

// The same result read against the organization's own norms instead of the published ones.
export function withOrgNorms(result: TestResult, norms: OrgNorms): TestResult {
  const rows = applyOrgNorms(result.rows, norms);
  const ordered = byNotability(rows);
  return { ...result, rows, keyFindings: ordered.filter(isNotable), otherFindings: ordered.filter((row) => !isNotable(row)) };
}

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

export type HiddenGroup = { key: string; teamName: string | null; people: number };

// Teams that have results but too few people to show, so pages can say they were held back
// rather than leave them out without a word.
export function hiddenGroups(results: { teamId: string | null }[], teams: { id: string; name: string }[]): HiddenGroup[] {
  const everyone = results.length > 0 && results.length < MIN_GROUP ? [{ key: "all", teamName: null, people: results.length }] : [];
  return [
    ...everyone,
    ...teams.flatMap((team) => {
      const people = results.filter((result) => result.teamId === team.id).length;
      return people > 0 && people < MIN_GROUP ? [{ key: team.id, teamName: team.name, people }] : [];
    }),
  ];
}
