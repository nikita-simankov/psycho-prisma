import { describe, expect, it } from "vitest";
import { answerQuality } from "../answer-quality";
import { byNotability, normPosition } from "../norms";

const row = (stan: number | null, tGrade: number | null = null) => ({ stan, tGrade });

describe("normPosition", () => {
  it("places stens in bands", () => {
    expect(normPosition(row(3))?.band).toBe("low");
    expect(normPosition(row(4))?.band).toBe("average");
    expect(normPosition(row(7))?.band).toBe("average");
    expect(normPosition(row(8))?.band).toBe("high");
  });

  it("clamps T-scores to 20–80", () => {
    const position = normPosition(row(null, 95))!;
    expect(position).toMatchObject({ kind: "t", value: 80, band: "high", distance: 1 });
    expect(normPosition(row(null, 50))?.distance).toBe(0);
  });

  it("returns null without a norm score", () => {
    expect(normPosition(row(null))).toBeNull();
  });
});

describe("byNotability", () => {
  it("puts the most extreme scales first and keeps average ones in order", () => {
    const rows = [
      { id: "a", ...row(5) },
      { id: "b", ...row(9) },
      { id: "c", ...row(6) },
      { id: "d", ...row(1) },
      { id: "e", ...row(null) },
    ];
    expect(byNotability(rows).map((r) => r.id)).toEqual(["d", "b", "a", "c", "e"]);
  });
});

describe("answerQuality", () => {
  const questions = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
  const responses = (choice: (i: number) => number, count = 20) =>
    Array.from({ length: count }, (_, i) => ({ questionId: i + 1, choiceId: choice(i) }));
  const timings = (ms: number) => Object.fromEntries(questions.map((q) => [q.id, ms]));

  it("is quiet for varied, paced answers in Russian", () => {
    expect(answerQuality(questions, responses((i) => (i % 3) + 1), timings(4000), "ru")).toEqual([]);
  });

  it("flags one answer for nearly everything", () => {
    const warnings = answerQuality(questions, responses((i) => (i === 0 ? 2 : 1)), {}, "ru");
    expect(warnings).toEqual([{ kind: "sameAnswer", share: 95 }]);
  });

  it("flags implausibly fast answering and missing items", () => {
    const warnings = answerQuality(questions, responses((i) => (i % 2) + 1, 18), timings(600), "");
    expect(warnings).toEqual([
      { kind: "tooFast", secondsPerAnswer: 0.6 },
      { kind: "missing", count: 2 },
    ]);
  });

  it("warns when answered in a language other than the norms", () => {
    expect(answerQuality(questions, responses((i) => (i % 2) + 1), {}, "en")).toEqual([{ kind: "language", locale: "en" }]);
  });

  it("ignores short tests for patterns", () => {
    expect(answerQuality(questions.slice(0, 5), responses(() => 1, 5), { 1: 100, 2: 100, 3: 100 }, "ru")).toEqual([]);
  });
});

import { groupAverages } from "../results";

describe("groupAverages", () => {
  const person = (userId: string, teamId: string | null, stan: number) => ({
    userId,
    teamId,
    rows: [{ scaleId: 1, scaleName: "Stress", rawGrade: 3, correctedGrade: null, tGrade: null, stan, summary: null }],
  });

  it("hides groups of fewer than five people", () => {
    const results = [
      ...Array.from({ length: 5 }, (_, i) => person(`a${i}`, "t1", 4 + (i % 2))),
      ...Array.from({ length: 3 }, (_, i) => person(`b${i}`, "t2", 9)),
    ];
    const groups = groupAverages(results, [
      { id: "t1", name: "Sales" },
      { id: "t2", name: "Support" },
    ]);
    expect(groups.map((group) => [group.teamName, group.people])).toEqual([
      [null, 8],
      ["Sales", 5],
    ]);
    expect(groups[1].scales).toEqual([{ scaleId: 1, scaleName: "Stress", kind: "sten", average: 4.4 }]);
  });

  it("returns nothing below five people overall", () => {
    expect(groupAverages([person("a", null, 5)], [])).toEqual([]);
  });
});

import { completionRate, quarterOf, scaleTrends } from "../metrics";

describe("scaleTrends", () => {
  const rows = (stan: number, t: number | null = null) => [
    { scaleId: 1, scaleName: "Stress", rawGrade: 1, correctedGrade: null, tGrade: null, stan, summary: null },
    { scaleId: 2, scaleName: "Lie", rawGrade: 1, correctedGrade: null, tGrade: t, stan: null, summary: null },
  ];

  it("orders points by date and marks reliable changes", () => {
    const trends = scaleTrends([
      { createdAt: new Date("2026-06-01"), rows: rows(7, 62) },
      { createdAt: new Date("2026-01-01"), rows: rows(4, 55) },
    ]);
    expect(trends[0].points.map((point) => point.value)).toEqual([4, 7]);
    // Stens at the default reliability: SEdiff ≈ 1.26, so 3 stens is a reliable change.
    expect(trends[0].change).toEqual({ delta: 3, rci: 2.37, reliable: true, direction: "up" });
    expect(trends[0]).toMatchObject({ reliability: 0.8, assumed: true });
    // Seven T-points is within the ≈ 12.6-point error of the difference.
    expect(trends[1].change).toMatchObject({ delta: 7, reliable: false, direction: "none" });
  });

  it("uses a scale's stated reliability", () => {
    const info = { 1: { reliability: 0.95, assumed: false } };
    const trends = scaleTrends([
      { createdAt: new Date("2026-01-01"), rows: rows(5), info },
      { createdAt: new Date("2026-06-01"), rows: rows(7), info },
    ]);
    expect(trends[0]).toMatchObject({ reliability: 0.95, assumed: false, change: { delta: 2, reliable: true } });
  });

  it("has no change with a single result", () => {
    expect(scaleTrends([{ createdAt: new Date(), rows: rows(5) }])[0].change).toBeNull();
  });
});

describe("quarterOf and completionRate", () => {
  it("names calendar quarters", () => {
    expect(quarterOf(new Date("2026-09-30T12:00:00"))).toMatchObject({ key: "2026-3", quarter: 3 });
  });

  it("counts only assignments that could have been finished", () => {
    const now = new Date("2026-09-26");
    const round = (closed: boolean, due: string | null) => ({ closedAt: closed ? now : null, dueAt: due ? new Date(due) : null });
    expect(
      completionRate(
        [
          { completedAt: now, round: round(false, null) },
          { completedAt: null, round: round(true, null) },
          { completedAt: null, round: round(false, "2026-09-01") },
          { completedAt: null, round: round(false, "2026-12-01") },
        ],
        now
      )
    ).toEqual({ done: 1, total: 3 });
    expect(completionRate([], now)).toBeNull();
  });
});
