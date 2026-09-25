import type { Test } from "@prisma/client";
import {
  StanTableRow,
  SummaryTableRow,
  TestQuestionResponse,
  TestScale,
  TGradeTableRow,
} from "./constants";
import { GradeStrategy } from "./strategies/grade-strategy";
import { StanStrategy } from "./strategies/stan-strategy";
import { TGradeStrategy } from "./strategies/t-grade-strategy";

// The Mini-Mult K-correction: the correction scale and the scales it adjusts.
const CORRECTION_SCALE_NAME = "Шкала коррекции (К)";
const CORRECTED_SCALE_IDS = [4, 7, 9, 10, 11];

type ScorableTest = Pick<
  Test,
  "strategy" | "scales" | "stanTable" | "tGradeTable" | "summaryTable"
>;

export type SubmissionScore =
  | {
      strategy: "t-grade";
      result: ReturnType<typeof TGradeStrategy.getSummary>;
    }
  | {
      strategy: "standard-ten";
      result: ReturnType<typeof StanStrategy.getSummary>;
    }
  | {
      strategy: "grade";
      result: ReturnType<typeof GradeStrategy.getSummary>;
    };

export function scoreSubmission(
  test: ScorableTest,
  responses: TestQuestionResponse[]
): SubmissionScore | null {
  const scales = JSON.parse(test.scales) as TestScale[];
  const summaryTable = JSON.parse(test.summaryTable) as SummaryTableRow[];

  const scaleGrades = GradeStrategy.runCalculationFormula(
    GradeStrategy.calculateGradesForScales(scales, responses)
  );

  switch (test.strategy) {
    case "t-grade": {
      const tGradeTable = JSON.parse(test.tGradeTable) as TGradeTableRow[];
      const correctionScaleGrade = TGradeStrategy.getCorrectionScaleGrade(
        scaleGrades,
        CORRECTION_SCALE_NAME
      );
      const correctedGrades = TGradeStrategy.applyGradeCorrection(
        scaleGrades,
        CORRECTED_SCALE_IDS,
        correctionScaleGrade
      );
      const tGrades = TGradeStrategy.convertRawGradeToTGrade(
        correctedGrades,
        tGradeTable
      );

      return {
        strategy: "t-grade",
        result: TGradeStrategy.getSummary(tGrades, summaryTable),
      };
    }

    case "standard-ten": {
      const stanTable = JSON.parse(test.stanTable) as StanTableRow[];
      const stans = StanStrategy.getStanFromGrades(scaleGrades, stanTable);

      return {
        strategy: "standard-ten",
        result: StanStrategy.getSummary(
          stans.filter((item) => item !== undefined),
          summaryTable
        ),
      };
    }

    case "grade":
      return {
        strategy: "grade",
        result: GradeStrategy.getSummary(scaleGrades, summaryTable),
      };

    default:
      return null;
  }
}

// Stored summary for a submission, computed on the fly for rows saved before scoring moved to submit time.
export function getSubmissionSummary(
  test: ScorableTest,
  submission: { summary: string; submission: string }
): unknown[] {
  if (submission.summary) {
    return JSON.parse(submission.summary);
  }

  return (
    scoreSubmission(test, JSON.parse(submission.submission))?.result ?? []
  );
}

export type ScaleRow = {
  scaleId: number;
  scaleName: string;
  rawGrade: number | null;
  correctedGrade: number | null;
  tGrade: number | null;
  stan: number | null;
  summary: string | null;
};

type StoredEntry = {
  scale?: { id: number; name: string };
  grade?: number;
  correctedGrade?: number;
  tGradeValue?: number;
  stanValue?: number;
  summary?: string;
} | null;

// One display row per scale, whatever strategy produced the result.
export function toScaleRows(result: unknown[]): ScaleRow[] {
  return (result as StoredEntry[]).flatMap((entry) =>
    entry?.scale
      ? [
          {
            scaleId: entry.scale.id,
            scaleName: entry.scale.name,
            rawGrade: entry.grade ?? null,
            correctedGrade: entry.correctedGrade ?? null,
            tGrade: entry.tGradeValue ?? null,
            stan: entry.stanValue ?? null,
            summary: entry.summary ?? null,
          },
        ]
      : []
  );
}
