import type { TestQuestionResponse, TestScale } from "./constants";
import type { NormScale } from "./norms";

// Classical test theory for results and the studio: measurement error on a score, whether a
// change between two results is real, and how well a scale's items hang together.

// Standard deviation of each norm scale by construction: stens have a mean of 5.5 and SD 2,
// T-scores a mean of 50 and SD 10.
export const NORM_SD: Record<NormScale, number> = { sten: 2, t: 10 };

// Used when a scale doesn't state its reliability. Published personality scales mostly report
// Cronbach's alpha between 0.7 and 0.9, so 0.8 is a middle-of-the-road assumption.
export const DEFAULT_RELIABILITY = 0.8;

// |RCI| at or above this is a change unlikely (p < .05) to come from measurement error alone.
export const RCI_CRITICAL = 1.96;

// Fewer respondents than this and item statistics are too unstable to show.
export const MIN_ITEM_SAMPLE = 20;

export function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

// Sample standard deviation (n − 1).
export function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function variance(values: number[]) {
  return standardDeviation(values) ** 2;
}

// Pearson correlation; null when either side doesn't vary.
export function correlation(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

// A scale's stated reliability when it is a usable coefficient, otherwise the default.
export function reliabilityOf(scale: Pick<TestScale, "reliability"> | undefined) {
  const stated = scale?.reliability;
  return typeof stated === "number" && stated > 0 && stated < 1
    ? { alpha: stated, assumed: false }
    : { alpha: DEFAULT_RELIABILITY, assumed: true };
}

// Standard error of measurement: how far an observed score typically sits from the true one.
export function standardError(sd: number, alpha: number) {
  return sd * Math.sqrt(1 - Math.min(1, Math.max(0, alpha)));
}

export type ReliableChange = {
  delta: number;
  // Jacobson–Truax reliable change index: the change over the standard error of the difference.
  rci: number;
  reliable: boolean;
  direction: "up" | "down" | "none";
};

// Whether the change from one score to the next exceeds what measurement error would produce.
export function reliableChange(before: number, after: number, sd: number, alpha: number): ReliableChange {
  const delta = Math.round((after - before) * 10) / 10;
  const errorOfDifference = Math.SQRT2 * standardError(sd, alpha);
  const rci = errorOfDifference === 0 ? (delta === 0 ? 0 : Infinity * Math.sign(delta)) : delta / errorOfDifference;
  const reliable = Math.abs(rci) >= RCI_CRITICAL;
  return {
    delta,
    rci: Number.isFinite(rci) ? Math.round(rci * 100) / 100 : rci,
    reliable,
    direction: !reliable ? "none" : delta > 0 ? "up" : "down",
  };
}

// Cronbach's alpha for a respondents × items matrix; null with fewer than two items or no
// variance in the totals.
export function cronbachAlpha(matrix: number[][]) {
  const items = matrix[0]?.length ?? 0;
  if (items < 2 || matrix.length < 2) return null;
  const columns = Array.from({ length: items }, (_, index) => matrix.map((row) => row[index]));
  const totals = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const totalVariance = variance(totals);
  if (totalVariance === 0) return null;
  const itemVariance = columns.reduce((sum, column) => sum + variance(column), 0);
  return (items / (items - 1)) * (1 - itemVariance / totalVariance);
}

export type ItemStatistic = {
  questionId: number;
  // Mean item score as a share of the most the item can give: for right/wrong or keyed yes/no
  // items, the share of people who scored it (the classical p-value).
  difficulty: number | null;
  // Correlation of the item with the sum of the scale's other items.
  discrimination: number | null;
};

export type ScaleAnalysis = {
  scaleId: number;
  scaleName: string;
  items: ItemStatistic[];
  alpha: number | null;
};

// Item difficulty, corrected item-total discrimination and Cronbach's alpha for each scale,
// from the item scores its keys give each respondent's answers.
export function analyzeItems(scales: Pick<TestScale, "id" | "name" | "keys" | "validity">[], submissions: TestQuestionResponse[][]): ScaleAnalysis[] {
  return scales.map((scale) => {
    const questionIds = Array.from(new Set(scale.keys.map((key) => key.questionId)));
    const grades = new Map(scale.keys.map((key) => [`${key.questionId}:${key.choiceId}`, key.grade]));
    const range = new Map(
      questionIds.map((questionId) => {
        const values = [0, ...scale.keys.filter((key) => key.questionId === questionId).map((key) => key.grade)];
        return [questionId, { min: Math.min(...values), max: Math.max(...values) }];
      })
    );

    const matrix = submissions.map((responses) => {
      const choice = new Map(responses.map((response) => [response.questionId, response.choiceId]));
      return questionIds.map((questionId) => grades.get(`${questionId}:${choice.get(questionId)}`) ?? 0);
    });
    const totals = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));

    const items = questionIds.map((questionId, index) => {
      const column = matrix.map((row) => row[index]);
      const { min, max } = range.get(questionId)!;
      return {
        questionId,
        difficulty: matrix.length && max > min ? (mean(column) - min) / (max - min) : null,
        discrimination: questionIds.length > 1 ? correlation(column, totals.map((total, row) => total - column[row])) : null,
      };
    });

    return { scaleId: scale.id, scaleName: scale.name, items, alpha: cronbachAlpha(matrix) };
  });
}
