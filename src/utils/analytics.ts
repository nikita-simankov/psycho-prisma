import { normPosition, type NormScale } from "./norms";
import { quarterOf } from "./metrics";
import { MIN_GROUP } from "./results";
import type { ScaleRow } from "./scoring";

export type AnalyticsEntry = { userId: string; teamId: string | null; createdAt: Date; rows: ScaleRow[] };

// Each person's most recent entry.
export function latestPerPerson<T extends { userId: string; createdAt: Date }>(entries: T[]): T[] {
  const latest = new Map<string, T>();
  for (const entry of entries) {
    const current = latest.get(entry.userId);
    if (!current || current.createdAt < entry.createdAt) latest.set(entry.userId, entry);
  }
  return Array.from(latest.values());
}

export type Distribution = {
  scaleId: number;
  scaleName: string;
  kind: NormScale;
  people: number;
  // Bins in scale order: stens one per value 1–10, T-scores in tens from 20 to 80.
  bins: { label: string; from: number; count: number }[];
};

const BINS = {
  sten: Array.from({ length: 10 }, (_, index) => ({ from: index + 1, to: index + 1 })),
  t: [20, 30, 40, 50, 60, 70].map((from) => ({ from, to: from === 70 ? 80 : from + 9.99 })),
} as const;

// How the latest scores spread across each normed scale. Scales with fewer than MIN_GROUP
// people are left out.
export function distributions(entries: AnalyticsEntry[]): Distribution[] {
  const scales = new Map<number, { scaleName: string; kind: NormScale; values: number[] }>();
  for (const entry of latestPerPerson(entries)) {
    for (const row of entry.rows) {
      const position = normPosition(row);
      if (!position) continue;
      const scale = scales.get(row.scaleId) ?? { scaleName: row.scaleName, kind: position.kind, values: [] };
      scale.values.push(position.value);
      scales.set(row.scaleId, scale);
    }
  }

  return Array.from(scales.entries())
    .filter(([, scale]) => scale.values.length >= MIN_GROUP)
    .map(([scaleId, scale]) => ({
      scaleId,
      scaleName: scale.scaleName,
      kind: scale.kind,
      people: scale.values.length,
      bins: BINS[scale.kind].map((bin) => ({
        label: bin.from === bin.to ? String(bin.from) : `${bin.from}–${Math.floor(bin.to)}`,
        from: bin.from,
        count: scale.values.filter((value) => value >= bin.from && value <= bin.to).length,
      })),
    }));
}

export type QuarterSeries = {
  scaleId: number;
  scaleName: string;
  kind: NormScale;
  points: { key: string; year: number; quarter: number; average: number; people: number }[];
};

// The average score on each normed scale per calendar quarter, from each person's latest
// result within that quarter. Quarters with fewer than MIN_GROUP people are left out.
export function quarterlyAverages(entries: AnalyticsEntry[]): QuarterSeries[] {
  const quarters = new Map<string, AnalyticsEntry[]>();
  for (const entry of entries) {
    const { key } = quarterOf(entry.createdAt);
    quarters.set(key, [...(quarters.get(key) ?? []), entry]);
  }

  const series = new Map<number, QuarterSeries>();
  const keys = Array.from(quarters.keys()).sort((a, b) => {
    const [ay, aq] = a.split("-").map(Number);
    const [by, bq] = b.split("-").map(Number);
    return ay - by || aq - bq;
  });

  for (const key of keys) {
    const latest = latestPerPerson(quarters.get(key)!);
    const { year, quarter } = quarterOf(latest[0].createdAt);
    const sums = new Map<number, { scaleName: string; kind: NormScale; total: number; count: number }>();
    for (const entry of latest) {
      for (const row of entry.rows) {
        const position = normPosition(row);
        if (!position) continue;
        const sum = sums.get(row.scaleId) ?? { scaleName: row.scaleName, kind: position.kind, total: 0, count: 0 };
        sum.total += position.value;
        sum.count += 1;
        sums.set(row.scaleId, sum);
      }
    }
    for (const [scaleId, sum] of Array.from(sums.entries())) {
      if (sum.count < MIN_GROUP) continue;
      const entry = series.get(scaleId) ?? { scaleId, scaleName: sum.scaleName, kind: sum.kind, points: [] };
      entry.points.push({ key, year, quarter, average: Math.round((sum.total / sum.count) * 10) / 10, people: sum.count });
      series.set(scaleId, entry);
    }
  }

  return Array.from(series.values());
}

// Completed share for a group of assignments; null when the group is too small to show.
export function participation(assignments: { completedAt: Date | null }[]) {
  if (assignments.length < MIN_GROUP) return null;
  const done = assignments.filter((assignment) => assignment.completedAt).length;
  return { done, total: assignments.length, percent: Math.round((done / assignments.length) * 100) };
}

// Sequential step (1–7) for a heatmap cell, from the low to the high end of the scale.
export function heatStep(kind: NormScale, value: number) {
  const [min, max] = kind === "sten" ? [1, 10] : [20, 80];
  const share = (Math.min(max, Math.max(min, value)) - min) / (max - min);
  return Math.min(7, Math.floor(share * 7) + 1);
}

export type BalanceGroup = {
  key: string;
  // Null for everyone in view.
  teamName: string | null;
  people: number;
  // Too few people to show anything.
  hidden: boolean;
  scales: { scaleId: number; scaleName: string; low: number; average: number; high: number; total: number }[];
};

// How many people in each group score low, average and high on each normed scale, from each
// person's latest result. Groups and scales with fewer than MIN_GROUP people carry no counts.
export function teamBalance(latest: AnalyticsEntry[], teams: { id: string; name: string }[]): BalanceGroup[] {
  const balance = (members: AnalyticsEntry[], key: string, teamName: string | null): BalanceGroup => {
    if (members.length < MIN_GROUP) return { key, teamName, people: members.length, hidden: true, scales: [] };
    const scales = new Map<number, BalanceGroup["scales"][number]>();
    for (const member of members) {
      for (const row of member.rows) {
        const position = normPosition(row);
        if (!position) continue;
        const scale = scales.get(row.scaleId) ?? { scaleId: row.scaleId, scaleName: row.scaleName, low: 0, average: 0, high: 0, total: 0 };
        scale[position.band] += 1;
        scale.total += 1;
        scales.set(row.scaleId, scale);
      }
    }
    return {
      key,
      teamName,
      people: members.length,
      hidden: false,
      scales: Array.from(scales.values()).filter((scale) => scale.total >= MIN_GROUP),
    };
  };

  return [
    balance(latest, "all", null),
    ...teams.flatMap((team) => {
      const members = latest.filter((entry) => entry.teamId === team.id);
      return members.length ? [balance(members, team.id, team.name)] : [];
    }),
  ];
}
