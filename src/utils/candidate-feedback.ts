import { normPosition } from "./norms";
import type { ScaleRow } from "./scoring";

// Feedback a candidate gets after a hiring process names a few of their stronger areas in plain
// words. It never carries a score, and scales at or below the middle of the scale are never named,
// so nothing in it reads as a weakness.

export const MAX_STRENGTHS = 3;

export type Strength = {
  scaleId: number;
  scaleName: string;
  testName: string;
  // "marked" for scores in the high band, "clear" for scores above the middle within the average one.
  level: "marked" | "clear";
};

// The candidate's highest scores above the middle of their norm scale, strongest first, at most
// MAX_STRENGTHS and each scale name once. Pass one result per test (the latest).
export function selectStrengths(results: { testName: string; rows: ScaleRow[] }[], max = MAX_STRENGTHS): Strength[] {
  const candidates = results.flatMap((result) =>
    result.rows.flatMap((row) => {
      const position = normPosition(row);
      const middle = position ? (position.min + position.max) / 2 : 0;
      return position && position.value > middle ? [{ row, position, testName: result.testName }] : [];
    })
  );
  const seen = new Set<string>();

  return candidates
    .sort((a, b) => b.position.distance - a.position.distance)
    .filter(({ row }) => {
      const key = row.scaleName.trim().toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max)
    .map(({ row, position, testName }) => ({
      scaleId: row.scaleId,
      scaleName: row.scaleName,
      testName,
      level: position.band === "high" ? "marked" : "clear",
    }));
}
