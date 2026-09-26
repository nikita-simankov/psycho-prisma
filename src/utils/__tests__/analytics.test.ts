import { describe, expect, it } from "vitest";
import { distributions, heatStep, latestPerPerson, participation, quarterlyAverages } from "../analytics";
import { toCsv } from "../csv";

const row = (stan: number) => [{ scaleId: 1, scaleName: "Stress", rawGrade: 1, correctedGrade: null, tGrade: null, stan, summary: null }];
const entry = (userId: string, date: string, stan: number) => ({ userId, teamId: null, createdAt: new Date(date), rows: row(stan) });

describe("analytics", () => {
  it("keeps each person's latest entry", () => {
    const latest = latestPerPerson([entry("a", "2026-01-01", 3), entry("a", "2026-05-01", 8), entry("b", "2026-02-01", 5)]);
    expect(latest.map((item) => item.rows[0].stan).sort()).toEqual([5, 8]);
  });

  it("bins latest stens and hides small groups", () => {
    const five = ["a", "b", "c", "d", "e"].map((id, index) => entry(id, "2026-03-01", index + 3));
    const [scale] = distributions(five);
    expect(scale.people).toBe(5);
    expect(scale.bins.map((bin) => bin.count)).toEqual([0, 0, 1, 1, 1, 1, 1, 0, 0, 0]);
    expect(distributions(five.slice(0, 4))).toEqual([]);
  });

  it("averages quarters with enough people, oldest first", () => {
    const q2 = ["a", "b", "c", "d", "e"].map((id) => entry(id, "2026-05-10", 6));
    const q1 = ["a", "b", "c", "d", "e"].map((id) => entry(id, "2026-02-10", 4));
    const q3 = ["a", "b"].map((id) => entry(id, "2026-08-10", 9));
    const [series] = quarterlyAverages([...q2, ...q3, ...q1]);
    expect(series.points.map((point) => [point.key, point.average])).toEqual([
      ["2026-1", 4],
      ["2026-2", 6],
    ]);
  });

  it("reports participation only for groups of five or more", () => {
    expect(participation([{ completedAt: new Date() }])).toBeNull();
    const assignments: { completedAt: Date | null }[] = [...Array(4)].map(() => ({ completedAt: null }));
    expect(participation([...assignments, { completedAt: new Date() }])).toEqual({ done: 1, total: 5, percent: 20 });
  });

  it("maps scores onto seven heat steps", () => {
    expect([heatStep("sten", 1), heatStep("sten", 10), heatStep("t", 50)]).toEqual([1, 7, 4]);
  });

  it("writes safe CSV", () => {
    expect(toCsv([["a,b", "=SUM(1)", 3, null]])).toBe('﻿"a,b",\'=SUM(1),3,');
  });
});
