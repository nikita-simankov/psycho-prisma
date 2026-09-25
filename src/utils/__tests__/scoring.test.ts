import { describe, expect, it } from "vitest";
import tests from "../../../prisma/seed-data/tests.json";
import type { TestQuestion, TestQuestionResponse, TestScale } from "../constants";
import { scoreSubmission, toScaleRows } from "../scoring";

type SeedTest = (typeof tests)[number];

const parse = <T>(value: unknown): T => (typeof value === "string" ? JSON.parse(value) : value) as T;

function scorable(test: SeedTest) {
  return {
    strategy: test.strategy,
    scales: JSON.stringify(parse(test.scales)),
    stanTable: JSON.stringify(parse(test.stanTable)),
    tGradeTable: JSON.stringify(parse(test.tGradeTable)),
    summaryTable: JSON.stringify(parse(test.summaryTable)),
  };
}

// Deterministic answer sets: always the first choice, always the last, and a rotating pattern.
function answers(test: SeedTest, pick: (question: TestQuestion, index: number) => number) {
  return parse<TestQuestion[]>(test.questions).map(
    (question, index): TestQuestionResponse => ({ questionId: question.id, choiceId: pick(question, index) })
  );
}

const PATTERNS = {
  first: (q: TestQuestion) => q.choices[0].id,
  last: (q: TestQuestion) => q.choices[q.choices.length - 1].id,
  rotating: (q: TestQuestion, i: number) => q.choices[i % q.choices.length].id,
};

describe("scoreSubmission on every bundled test", () => {
  for (const test of tests) {
    describe(test.name, () => {
      for (const [name, pick] of Object.entries(PATTERNS)) {
        it(`scores the "${name}" answer pattern`, () => {
          const score = scoreSubmission(scorable(test), answers(test, pick));

          expect(score?.strategy).toBe(test.strategy);
          expect(toScaleRows(score!.result)).toMatchSnapshot();
        });
      }
    });
  }
});

describe("grade strategy", () => {
  const hads = tests.find((test) => test.name.includes("HADS"))!;
  const scales = parse<TestScale[]>(hads.scales);

  // For each question, the choice worth the most (or least) on the scale that keys it.
  const extreme = (direction: 1 | -1) =>
    answers(hads, (question) => {
      const keys = scales.flatMap((scale) => scale.keys).filter((key) => key.questionId === question.id);
      return keys.sort((a, b) => direction * (b.grade - a.grade))[0].choiceId;
    });

  it("sums item grades per scale and picks the matching interpretation", () => {
    const rows = toScaleRows(scoreSubmission(scorable(hads), extreme(1))!.result);

    expect(rows.map((row) => row.rawGrade)).toEqual([21, 21]);
    expect(rows.map((row) => row.summary)).toEqual([
      "Клинически выраженная тревога",
      "Клинически выраженная депрессия",
    ]);
  });

  it("scores zero when every answer is the least symptomatic", () => {
    const rows = toScaleRows(scoreSubmission(scorable(hads), extreme(-1))!.result);

    expect(rows.map((row) => row.rawGrade)).toEqual([0, 0]);
    expect(rows[0].summary).toBe("Отсутствуют достоверно выраженные симптомы тревоги");
  });

  it("ignores answers to questions a scale does not key", () => {
    const rows = toScaleRows(scoreSubmission(scorable(hads), [{ questionId: 999, choiceId: 1 }])!.result);

    expect(rows.map((row) => row.rawGrade)).toEqual([0, 0]);
  });
});

describe("unknown strategy", () => {
  it("returns null instead of guessing", () => {
    expect(scoreSubmission({ ...scorable(tests[0]), strategy: "other" }, [])).toBeNull();
  });
});
