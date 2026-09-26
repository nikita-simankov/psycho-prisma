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
