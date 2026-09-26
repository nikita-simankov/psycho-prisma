import type { SummaryTableRow } from "./constants";
import type { ScaleRow } from "./scoring";

export type NormScale = "sten" | "t";
export type Band = "low" | "average" | "high";

// Where a scale's score sits on its norm scale. Stens run 1–10 with 4–7 as the average band;
// T-scores run 20–80 (clamped) with 40–60 as the average band.
export type NormPosition = {
  kind: NormScale;
  value: number;
  min: number;
  max: number;
  averageFrom: number;
  averageTo: number;
  band: Band;
  // 0 at the middle of the scale, 1 at either end; used to put notable scales first.
  distance: number;
};

const SCALES = {
  sten: { min: 1, max: 10, averageFrom: 4, averageTo: 7 },
  t: { min: 20, max: 80, averageFrom: 40, averageTo: 60 },
} as const;

export function normPosition(row: Pick<ScaleRow, "stan" | "tGrade">): NormPosition | null {
  const kind: NormScale | null = row.stan !== null ? "sten" : row.tGrade !== null ? "t" : null;
  if (!kind) return null;

  const scale = SCALES[kind];
  const raw = kind === "sten" ? row.stan! : row.tGrade!;
  const value = Math.min(scale.max, Math.max(scale.min, raw));
  const middle = (scale.min + scale.max) / 2;
  const band: Band = value < scale.averageFrom ? "low" : value > scale.averageTo ? "high" : "average";

  return {
    kind,
    value,
    ...scale,
    band,
    distance: Math.abs(value - middle) / ((scale.max - scale.min) / 2),
  };
}

// Scales outside the average band first, the most extreme leading; the rest keep their order.
export function byNotability<T extends Pick<ScaleRow, "stan" | "tGrade">>(rows: T[]): T[] {
  return rows
    .map((row, index) => ({ row, index, position: normPosition(row) }))
    .sort((a, b) => {
      const notableA = a.position && a.position.band !== "average" ? a.position.distance : -1;
      const notableB = b.position && b.position.band !== "average" ? b.position.distance : -1;
      return notableB - notableA || a.index - b.index;
    })
    .map((entry) => entry.row);
}

export function isNotable(row: Pick<ScaleRow, "stan" | "tGrade">) {
  const position = normPosition(row);
  return position !== null && position.band !== "average";
}

// An organization's own norms need at least this many people per scale to be stable enough.
export const MIN_NORM_SAMPLE = 30;

export type NormSource = "published" | "org";
export type OrgNorm = { scaleId: number; mean: number; sd: number; n: number };
export type OrgNorms = { people: number; scales: Record<number, OrgNorm> };

// The raw score a norm table converts: after any correction, otherwise as scored.
export function rawScore(row: Pick<ScaleRow, "rawGrade" | "correctedGrade">) {
  return row.correctedGrade ?? row.rawGrade;
}

// Mean and standard deviation of each scale's raw score across one result per person.
// Scales with fewer than MIN_NORM_SAMPLE scores, or no spread at all, get no norm.
export function computeOrgNorms(results: Pick<ScaleRow, "scaleId" | "rawGrade" | "correctedGrade">[][]): OrgNorms {
  const values = new Map<number, number[]>();
  for (const rows of results) {
    for (const row of rows) {
      const raw = rawScore(row);
      if (raw === null || !Number.isFinite(raw)) continue;
      values.set(row.scaleId, [...(values.get(row.scaleId) ?? []), raw]);
    }
  }

  const scales: Record<number, OrgNorm> = {};
  for (const [scaleId, list] of Array.from(values.entries())) {
    if (list.length < MIN_NORM_SAMPLE) continue;
    const mean = list.reduce((sum, value) => sum + value, 0) / list.length;
    const sd = Math.sqrt(list.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (list.length - 1));
    if (sd === 0) continue;
    scales[scaleId] = { scaleId, mean: Math.round(mean * 100) / 100, sd: Math.round(sd * 100) / 100, n: list.length };
  }
  return { people: results.length, scales };
}

export function hasOrgNorms(norms: OrgNorms | null): norms is OrgNorms {
  return norms !== null && Object.keys(norms.scales).length > 0;
}

// The same rows re-expressed against the organization's own norms: T-score scales as T-scores
// (50 ± 10 per SD), everything else as stens (5.5 ± 2 per SD). Scales without an own norm lose
// their norm score, so a profile never mixes the two reference groups.
export function applyOrgNorms<T extends ScaleRow>(rows: T[], norms: OrgNorms): T[] {
  return rows.map((row) => {
    const norm = norms.scales[row.scaleId];
    const raw = rawScore(row);
    if (!norm || raw === null) return { ...row, stan: null, tGrade: null };
    const z = (raw - norm.mean) / norm.sd;
    return row.tGrade !== null
      ? { ...row, tGrade: Math.round(50 + 10 * z), stan: null }
      : { ...row, stan: Math.min(10, Math.max(1, Math.round(5.5 + 2 * z))), tGrade: null };
  });
}

// Points inside each band, most typical first, to find the interpretation text that covers it.
const BAND_POINTS: Record<NormScale, Record<Band, number[]>> = {
  sten: { low: [2, 3, 1], average: [5.5, 5, 6], high: [9, 8, 10] },
  t: { low: [30, 35, 20], average: [50, 45, 55], high: [70, 65, 80] },
};

// The test's own interpretation of a low, average and high score on a scale, where its summary
// table has text for those ranges.
export function bandReadings(
  summaryTable: Pick<SummaryTableRow, "scaleId" | "minStanValue" | "maxStanValue" | "minTGrade" | "maxTGrade" | "summaryText">[],
  scaleId: number,
  kind: NormScale
): Partial<Record<Band, string>> {
  const rows = summaryTable.filter((row) => row.scaleId === scaleId && row.summaryText.trim());
  const readings: Partial<Record<Band, string>> = {};
  for (const band of ["low", "average", "high"] as const) {
    const covers = (point: number) => (row: (typeof rows)[number]) =>
      kind === "sten" ? point >= row.minStanValue && point <= row.maxStanValue : point >= row.minTGrade && point <= row.maxTGrade;
    const match = BAND_POINTS[kind][band].map((point) => rows.find(covers(point))).find(Boolean);
    if (match) readings[band] = match.summaryText.trim();
  }
  return readings;
}
