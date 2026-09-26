import { describe, expect, it } from "vitest";
import { teamBalance } from "../analytics";
import { qualityScore } from "../answer-quality";
import { applyOrgNorms, bandReadings, computeOrgNorms, MIN_NORM_SAMPLE } from "../norms";
import {
  analyzeItems,
  correlation,
  cronbachAlpha,
  DEFAULT_RELIABILITY,
  reliabilityOf,
  reliableChange,
  standardError,
} from "../psychometrics";
import { hiddenGroups, scaleInfo } from "../results";
import type { ScaleRow } from "../scoring";

const row = (scaleId: number, values: Partial<ScaleRow>): ScaleRow => ({
  scaleId,
  scaleName: `Scale ${scaleId}`,
  rawGrade: null,
  correctedGrade: null,
  tGrade: null,
  stan: null,
  summary: null,
  ...values,
});

describe("qualityScore", () => {
  it("is 100 and good with no warnings", () => {
    expect(qualityScore([], 20)).toEqual({ score: 100, band: "good" });
  });

  it("costs a little for the language and in proportion for missing answers", () => {
    expect(qualityScore([{ kind: "language", locale: "en" }], 20)).toEqual({ score: 90, band: "good" });
    expect(qualityScore([{ kind: "missing", count: 5 }], 20)).toEqual({ score: 75, band: "fair" });
    // Capped, so a mostly blank submission doesn't dominate the other signs.
    expect(qualityScore([{ kind: "missing", count: 19 }], 20).score).toBe(60);
  });

  it("is poor for uniform and very fast answering", () => {
    const score = qualityScore(
      [
        { kind: "sameAnswer", share: 100 },
        { kind: "tooFast", secondsPerAnswer: 0.5 },
      ],
      20
    );
    expect(score).toEqual({ score: 0, band: "poor" });
    expect(qualityScore([{ kind: "sameAnswer", share: 90 }], 20)).toEqual({ score: 60, band: "fair" });
  });
});

describe("standard error and reliable change", () => {
  it("shrinks the error band as reliability rises", () => {
    expect(standardError(2, 0.8)).toBeCloseTo(0.894, 3);
    expect(standardError(10, 0.91)).toBeCloseTo(3, 5);
    expect(standardError(2, 1)).toBe(0);
  });

  it("marks a change reliable when |RCI| reaches 1.96", () => {
    // SEdiff = 2 · √2 · √0.2 ≈ 1.265 stens.
    expect(reliableChange(4, 7, 2, 0.8)).toEqual({ delta: 3, rci: 2.37, reliable: true, direction: "up" });
    expect(reliableChange(6, 4, 2, 0.8)).toMatchObject({ delta: -2, reliable: false, direction: "none" });
    expect(reliableChange(60, 40, 10, 0.8)).toMatchObject({ reliable: true, direction: "down" });
  });

  it("falls back to the default reliability when a scale states none", () => {
    expect(reliabilityOf({ reliability: 0.72 })).toEqual({ alpha: 0.72, assumed: false });
    expect(reliabilityOf({})).toEqual({ alpha: DEFAULT_RELIABILITY, assumed: true });
    expect(reliabilityOf({ reliability: 1.4 })).toEqual({ alpha: DEFAULT_RELIABILITY, assumed: true });
  });
});

describe("cronbachAlpha and item analysis", () => {
  const matrix = [
    [2, 3, 3],
    [4, 4, 5],
    [3, 5, 4],
    [1, 2, 2],
    [3, 3, 4],
  ];

  it("matches the textbook formula", () => {
    expect(cronbachAlpha(matrix)).toBeCloseTo(0.932, 3);
    expect(cronbachAlpha([[1, 1], [2, 2], [3, 3]])).toBeCloseTo(1, 10);
  });

  it("is undefined without two items or any spread", () => {
    expect(cronbachAlpha([[1], [2]])).toBeNull();
    expect(cronbachAlpha([[1, 1], [1, 1]])).toBeNull();
    expect(correlation([1, 1, 1], [1, 2, 3])).toBeNull();
  });

  it("gives difficulty and corrected item-total correlation per item", () => {
    // Three yes/no items keyed on choice 1; five people.
    const scale = {
      id: 7,
      name: "Stress",
      keys: [1, 2, 3].map((questionId) => ({ questionId, choiceId: 1, grade: 1 })),
    };
    const answers = (choices: number[]) => choices.map((choiceId, index) => ({ questionId: index + 1, choiceId }));
    const [analysis] = analyzeItems(
      [scale],
      [answers([1, 1, 1]), answers([1, 1, 2]), answers([1, 2, 2]), answers([2, 2, 2]), answers([1, 1, 1])]
    );

    expect(analysis.scaleId).toBe(7);
    expect(analysis.items.map((item) => item.difficulty)).toEqual([0.8, 0.6, 0.4]);
    // Each item agrees with the sum of the other two.
    expect(analysis.items.every((item) => (item.discrimination ?? 0) > 0.5)).toBe(true);
    expect(analysis.alpha).toBeGreaterThan(0.7);
  });
});

describe("organization norms", () => {
  const people = (count: number) =>
    Array.from({ length: count }, (_, index) => [row(1, { rawGrade: index % 10, stan: 5 }), row(2, { rawGrade: 3, correctedGrade: 4, tGrade: 55 })]);

  it("needs enough people per scale and some spread", () => {
    expect(computeOrgNorms(people(MIN_NORM_SAMPLE - 1)).scales).toEqual({});
    const norms = computeOrgNorms(people(MIN_NORM_SAMPLE));
    expect(norms.people).toBe(MIN_NORM_SAMPLE);
    expect(norms.scales[1]).toMatchObject({ mean: 4.5, n: MIN_NORM_SAMPLE });
    expect(norms.scales[1].sd).toBeCloseTo(2.92, 2);
    // Everyone scored the same on scale 2, so it can't be normed.
    expect(norms.scales[2]).toBeUndefined();
  });

  it("re-expresses scores as stens or T-scores against the organization", () => {
    const norms = { people: 40, scales: { 1: { scaleId: 1, mean: 10, sd: 4, n: 40 }, 2: { scaleId: 2, mean: 20, sd: 5, n: 40 } } };
    const [sten, t, none] = applyOrgNorms(
      [row(1, { rawGrade: 14, stan: 9 }), row(2, { rawGrade: 25, tGrade: 70 }), row(3, { rawGrade: 1, stan: 2 })],
      norms
    );
    expect(sten).toMatchObject({ stan: 8, tGrade: null });
    expect(t).toMatchObject({ tGrade: 60, stan: null });
    expect(none).toMatchObject({ stan: null, tGrade: null });
  });
});

describe("scale information", () => {
  const summary = (scaleId: number, from: number, to: number, text: string) => ({
    scaleId,
    strategy: "standard-ten",
    minGrade: 0,
    maxGrade: 0,
    minTGrade: from * 10,
    maxTGrade: to * 10,
    minStanValue: from,
    maxStanValue: to,
    summaryText: text,
  });

  it("finds the test's reading of low, average and high scores", () => {
    const table = [summary(1, 1, 3, "Calm"), summary(1, 4, 7, "Typical"), summary(1, 8, 10, "Tense"), summary(2, 5, 6, "Middle")];
    expect(bandReadings(table, 1, "sten")).toEqual({ low: "Calm", average: "Typical", high: "Tense" });
    expect(bandReadings(table, 2, "sten")).toEqual({ average: "Middle" });
    const tTable = [summary(3, 2, 3.9, "Low T"), summary(3, 4, 6, "Mid T"), summary(3, 6.1, 8, "High T")];
    expect(bandReadings(tTable, 3, "t")).toEqual({ low: "Low T", average: "Mid T", high: "High T" });
  });

  it("carries descriptions and reliability, assumed where missing", () => {
    const scales = [
      { id: 1, name: "A", keys: [], multiplier: 1, correction: 0, resultCalculationFormula: "", description: " Worry ", reliability: 0.85 },
      { id: 2, name: "B", keys: [], multiplier: 1, correction: 0, resultCalculationFormula: "" },
    ];
    const info = scaleInfo(scales, [summary(1, 8, 10, "High worry")], "standard-ten");
    expect(info[1]).toEqual({ description: "Worry", readings: { high: "High worry" }, reliability: 0.85, assumed: false });
    expect(info[2]).toEqual({ description: null, readings: {}, reliability: DEFAULT_RELIABILITY, assumed: true });
    expect(scaleInfo(scales, [], "grade")[1].readings).toEqual({});
  });
});

describe("privacy for small groups", () => {
  const entry = (userId: string, teamId: string | null, stan: number) => ({
    userId,
    teamId,
    createdAt: new Date("2026-06-01"),
    rows: [row(1, { stan })],
  });
  const teams = [
    { id: "big", name: "Sales" },
    { id: "small", name: "Legal" },
    { id: "empty", name: "Board" },
  ];
  const latest = [
    ...[2, 5, 5, 6, 9, 9].map((stan, index) => entry(`s${index}`, "big", stan)),
    entry("l1", "small", 5),
    entry("l2", "small", 8),
  ];

  it("counts low, average and high per scale and hides small teams", () => {
    const balance = teamBalance(latest, teams);
    expect(balance.map((group) => [group.key, group.hidden])).toEqual([
      ["all", false],
      ["big", false],
      ["small", true],
    ]);
    expect(balance[1].scales[0]).toMatchObject({ low: 1, average: 3, high: 2, total: 6 });
    expect(balance[2].scales).toEqual([]);
  });

  it("lists teams held back for being too small", () => {
    expect(hiddenGroups(latest, teams)).toEqual([{ key: "small", teamName: "Legal", people: 2 }]);
    expect(hiddenGroups(latest.slice(0, 2), [])).toEqual([{ key: "all", teamName: null, people: 2 }]);
  });
});
