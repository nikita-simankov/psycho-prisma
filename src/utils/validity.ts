import { TestQuestionResponse, TestScale, ValidityRule } from "./constants";
import type { ScaleRow } from "./scoring";
import { GradeStrategy } from "./strategies/grade-strategy";

export type ValidityCheck = {
  scaleId: number;
  scaleName: string;
  measure: ValidityRule["measure"];
  value: number | null;
  max: number | null;
  // "high" means above the cut-off; "unset" means the test has no cut-off for this scale.
  status: "ok" | "high" | "unset";
  // The test's own interpretation of this score, when it has one.
  summary: string | null;
};

export type Validity = {
  status: "reliable" | "questionable" | "unknown";
  checks: ValidityCheck[];
};

export function validityScaleIds(scales: TestScale[]): Set<number> {
  return new Set(scales.filter((scale) => scale.validity).map((scale) => scale.id));
}

// Reads the lie, sincerity and other validity scales of one submission. Raw grades are
// recomputed from the answers because stored summaries leave out scales without norms.
export function assessValidity(
  scales: TestScale[],
  responses: TestQuestionResponse[],
  rows: ScaleRow[]
): Validity | null {
  const validityScales = scales.filter((scale) => scale.validity);

  if (validityScales.length === 0) {
    return null;
  }

  const grades = GradeStrategy.runCalculationFormula(GradeStrategy.calculateGradesForScales(scales, responses));
  const checks = validityScales.map((scale): ValidityCheck => {
    const rule = scale.validity!;
    const row = rows.find((item) => item.scaleId === scale.id);
    const value =
      rule.measure === "grade"
        ? grades.find((entry) => entry.scale.id === scale.id)?.grade ?? null
        : rule.measure === "stan"
          ? row?.stan ?? null
          : row?.tGrade ?? null;
    const max = rule.max ?? null;

    return {
      scaleId: scale.id,
      scaleName: row?.scaleName ?? scale.name,
      measure: rule.measure,
      value: value === null ? null : Math.round(value * 100) / 100,
      max,
      status: max === null || value === null ? "unset" : value > max ? "high" : "ok",
      summary: row?.summary ?? null,
    };
  });

  const status = checks.some((check) => check.status === "high")
    ? "questionable"
    : checks.some((check) => check.status === "ok")
      ? "reliable"
      : "unknown";

  return { status, checks };
}
