import { normPosition, type NormScale } from "./norms";
import { DEFAULT_RELIABILITY, NORM_SD, reliableChange, type ReliableChange } from "./psychometrics";
import type { ScaleRow } from "./scoring";

export type ScaleTrend = {
  scaleId: number;
  scaleName: string;
  kind: NormScale;
  points: { date: Date; value: number }[];
  // The reliability the change was judged with, and whether it was assumed for want of one.
  reliability: number;
  assumed: boolean;
  // Latest against the one before, when there are two or more: the difference and whether it
  // is a reliable change (Jacobson–Truax) rather than measurement error.
  change: ReliableChange | null;
};

type TrendResult = { createdAt: Date; rows: ScaleRow[]; info?: Record<number, { reliability: number; assumed: boolean }> };

// Each normed scale's scores over time, oldest first.
export function scaleTrends(results: TrendResult[]): ScaleTrend[] {
  const trends = new Map<number, ScaleTrend>();
  const ordered = [...results].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const result of ordered) {
    for (const row of result.rows) {
      const position = normPosition(row);
      if (!position) continue;
      const trend: ScaleTrend = trends.get(row.scaleId) ?? {
        scaleId: row.scaleId,
        scaleName: row.scaleName,
        kind: position.kind,
        points: [],
        reliability: DEFAULT_RELIABILITY,
        assumed: true,
        change: null,
      };
      trend.scaleName = row.scaleName;
      // The latest version's figure wins.
      const info = result.info?.[row.scaleId];
      if (info) Object.assign(trend, { reliability: info.reliability, assumed: info.assumed });
      trend.points.push({ date: result.createdAt, value: position.value });
      trends.set(row.scaleId, trend);
    }
  }

  return Array.from(trends.values()).map((trend) => {
    const [previous, latest] = trend.points.slice(-2);
    if (!latest) return trend;
    return { ...trend, change: reliableChange(previous.value, latest.value, NORM_SD[trend.kind], trend.reliability) };
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
