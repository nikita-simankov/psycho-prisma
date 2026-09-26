import { normPosition, type NormScale } from "./norms";
import type { ScaleRow } from "./scoring";

// Differences smaller than this are within ordinary measurement error: about one sten band
// either side, or one standard deviation (10 T-points) for T-scores. A rule of thumb in place
// of each scale's own standard error, which the instruments don't publish.
const MEANINGFUL = { sten: 2, t: 10 } as const;

export function isMeaningfulChange(kind: NormScale, delta: number) {
  return Math.abs(delta) >= MEANINGFUL[kind];
}

export type ScaleTrend = {
  scaleId: number;
  scaleName: string;
  kind: NormScale;
  points: { date: Date; value: number }[];
  // Latest minus the one before, when there are two or more.
  change: { delta: number; meaningful: boolean } | null;
};

// Each normed scale's scores over time, oldest first.
export function scaleTrends(results: { createdAt: Date; rows: ScaleRow[] }[]): ScaleTrend[] {
  const trends = new Map<number, ScaleTrend>();
  const ordered = [...results].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const result of ordered) {
    for (const row of result.rows) {
      const position = normPosition(row);
      if (!position) continue;
      const trend = trends.get(row.scaleId) ?? { scaleId: row.scaleId, scaleName: row.scaleName, kind: position.kind, points: [], change: null };
      trend.scaleName = row.scaleName;
      trend.points.push({ date: result.createdAt, value: position.value });
      trends.set(row.scaleId, trend);
    }
  }

  return Array.from(trends.values()).map((trend) => {
    const [previous, latest] = trend.points.slice(-2);
    if (!latest) return trend;
    const delta = Math.round((latest.value - previous.value) * 10) / 10;
    return { ...trend, change: { delta, meaningful: isMeaningfulChange(trend.kind, delta) } };
  });
}

// "2026 Q3" style label and a sortable key for a date's calendar quarter.
export function quarterOf(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return { key: `${date.getFullYear()}-${quarter}`, year: date.getFullYear(), quarter };
}

// Share of finished assignments among those that could have been finished: completed, closed or past due.
export function completionRate(assignments: { completedAt: Date | null; round: { closedAt: Date | null; dueAt: Date | null } }[], now = new Date()) {
  const settled = assignments.filter(
    (assignment) => assignment.completedAt || assignment.round.closedAt || (assignment.round.dueAt && assignment.round.dueAt < now)
  );
  if (settled.length === 0) return null;
  return { done: settled.filter((assignment) => assignment.completedAt).length, total: settled.length };
}
