import { describe, expect, it } from "vitest";
import tests from "../../../prisma/seed-data/tests.json";
import type { TestQuestionResponse, TestScale } from "../constants";
import { scoreSubmission, toScaleRows } from "../scoring";
import { assessValidity, validityScaleIds } from "../validity";

type SeedTest = (typeof tests)[number];

const byName = (part: string) => tests.find((test) => test.name.includes(part)) as SeedTest;

function scorable(test: SeedTest) {
  return {
    strategy: test.strategy,
    scales: JSON.stringify(test.scales),
    stanTable: JSON.stringify(test.stanTable),
    tGradeTable: JSON.stringify(test.tGradeTable),
    summaryTable: JSON.stringify(test.summaryTable),
  };
}

// Answers every key of the given scales, so their scores are as high as possible.
function answerKeys(test: SeedTest, scaleIds: number[]): TestQuestionResponse[] {
  const scales = test.scales as unknown as TestScale[];
  return scales
    .filter((scale) => scaleIds.includes(scale.id))
    .flatMap((scale) => scale.keys.map((key) => ({ questionId: key.questionId, choiceId: key.choiceId })));
}

function validityOf(test: SeedTest, responses: TestQuestionResponse[]) {
  const score = scoreSubmission(scorable(test), responses);
  return assessValidity(test.scales as unknown as TestScale[], responses, score ? toScaleRows(score.result) : []);
}

describe("assessValidity", () => {
  it("marks every bundled validity scale", () => {
    const marked = tests.filter((test) => validityScaleIds(test.scales as unknown as TestScale[]).size > 0);
    expect(marked.map((test) => test.name).sort()).toMatchSnapshot();
  });

  it("returns null for tests without validity scales", () => {
    expect(validityOf(byName("Бека"), [])).toBeNull();
  });

  it("flags a high lie score on SR-45", () => {
    const test = byName("суицидальным");
    const validity = validityOf(test, answerKeys(test, [2]))!;
    expect(validity.status).toBe("questionable");
    expect(validity.checks[0]).toMatchObject({ scaleId: 2, status: "high", max: 0.75 });
  });

  it("accepts a zero lie score on SR-45", () => {
    const validity = validityOf(byName("суицидальным"), [])!;
    expect(validity.status).toBe("reliable");
  });

  it("reads MLO-AM's validity scale even though it has no norms", () => {
    const test = byName("Адаптивность");
    const validity = validityOf(test, answerKeys(test, [1]))!;
    expect(validity.checks[0]).toMatchObject({ scaleId: 1, status: "high", max: 10 });
    expect(validity.checks[0].value).toBeGreaterThan(10);
  });

  it("shows Prognoz-2 sincerity without a verdict", () => {
    const test = byName("Прогноз-2");
    const validity = validityOf(test, answerKeys(test, [1]))!;
    expect(validity.status).toBe("unknown");
    expect(validity.checks[0]).toMatchObject({ status: "unset", max: null });
  });

  it("checks all three Mini-Mult scales on T-scores", () => {
    const test = byName("Сокращенный многофакторный");
    const validity = validityOf(test, answerKeys(test, [1, 2]))!;
    expect(validity.checks.map((check) => check.scaleId)).toEqual([1, 2, 3]);
    expect(validity.checks[0]).toMatchObject({ measure: "tGrade", status: "high" });
    // A raw F above the end of the T-score table still gets the table's top T-score.
    expect(validity.checks[1]).toMatchObject({ value: 95, status: "high" });
    expect(validity.status).toBe("questionable");
  });
});
