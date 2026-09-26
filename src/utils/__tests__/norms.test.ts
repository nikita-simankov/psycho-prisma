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
