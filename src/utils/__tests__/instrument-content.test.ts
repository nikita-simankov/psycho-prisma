import { describe, expect, it } from "vitest";
import { scoreSubmission } from "../scoring";
import { testContentSchema } from "../instrument-schema";
import { blankTest, formulaValid, testColumns, testContentOf, nextId, pruneOverlays, validateFormContent, validateTestContent, type TestContent } from "../instrument-content";

const valid = (): TestContent => ({
  ...blankTest("Stress check"),
  strategy: "standard-ten",
  questions: [
    { id: 1, text: "I feel tense", type: "List", choices: [{ id: 1, text: "Yes" }, { id: 2, text: "No" }] },
    { id: 2, text: "I sleep well", type: "List", choices: [{ id: 1, text: "Yes" }, { id: 2, text: "No" }] },
  ],
  scales: [{ id: 1, name: "Stress", keys: [{ questionId: 1, choiceId: 1, grade: 1 }, { questionId: 2, choiceId: 2, grade: 1 }], multiplier: 1, correction: 0, resultCalculationFormula: "Нет" }],
  stanTable: [
    { scaleId: 1, minGrade: 0, maxGrade: 0, stanValue: 3 },
    { scaleId: 1, minGrade: 1, maxGrade: 2, stanValue: 7 },
  ],
  summaryTable: [{ scaleId: 1, strategy: "standard-ten", minGrade: 0, maxGrade: 0, minTGrade: 0, maxTGrade: 0, minStanValue: 1, maxStanValue: 5, summaryText: "Calm" }],
});

describe("validateTestContent", () => {
  it("accepts a complete test", () => {
    expect(validateTestContent(valid())).toEqual([]);
  });

  it("names what is missing", () => {
    const content = valid();
    content.name = " ";
    content.questions[1].choices = [{ id: 1, text: "" }];
    content.scales[0].keys.push({ questionId: 9, choiceId: 1, grade: 1 });
    content.stanTable[1].minGrade = 0;
    expect(validateTestContent(content).map((issue) => issue.code)).toEqual(["name", "fewChoices", "choiceText", "unknownKey", "normOverlap"]);
  });

  it("needs norms for every scale when scored in stens", () => {
    const content = valid();
    content.stanTable = [];
    expect(validateTestContent(content)).toContainEqual({ code: "noNorms", scale: 1 });
  });
});

describe("validateFormContent", () => {
  it("only asks choices of list questions", () => {
    expect(
      validateFormContent({ name: "Intake", description: "", ttc: 5, adminOnly: false, questions: [{ id: 1, text: "Why?", type: "Text", choices: [] }] })
    ).toEqual([]);
  });
});

describe("formulaValid", () => {
  const ids = new Set([1, 2]);
  it("accepts arithmetic on known scales", () => {
    expect(formulaValid("($1 + $2) / 2", ids)).toBe(true);
  });
  it("rejects unknown scales, code and unbalanced brackets", () => {
    expect(formulaValid("$3 + 1", ids)).toBe(false);
    expect(formulaValid("alert(1)", ids)).toBe(false);
    expect(formulaValid("($1 + 1", ids)).toBe(false);
  });
});

describe("nextId and pruneOverlays", () => {
  it("never reuses an id", () => {
    expect(nextId([{ id: 4 }, { id: 2 }])).toBe(5);
    expect(nextId([])).toBe(1);
  });

  it("drops translations of edited texts only", () => {
    const before = { name: "A", description: "", questions: [{ id: 1, text: "Q1", choices: [{ id: 1, text: "Yes" }, { id: 2, text: "No" }] }, { id: 2, text: "Q2", choices: [] }], scales: [{ id: 1, name: "S" }] };
    const after = { ...before, name: "B", questions: [{ id: 1, text: "Q1 edited", choices: [{ id: 1, text: "Yes" }, { id: 2, text: "Nope" }] }] };
    const translations = JSON.stringify({
      en: { name: "A en", questions: { "1": { text: "Q1 en", choices: { "1": "Yes en", "2": "No en" } }, "2": { text: "Q2 en" } }, scales: { "1": "S en" } },
    });
    expect(JSON.parse(pruneOverlays(before, after, translations))).toEqual({
      en: { questions: { "1": { choices: { "1": "Yes en" } } }, scales: { "1": "S en" } },
    });
  });
});

describe("library content in the studio", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const library = require("../../../prisma/seed-data/tests.json") as Record<string, unknown>[];
  const rowOf = (test: Record<string, unknown>) =>
    Object.fromEntries(
      ["name", "description", "instruction", "ttc", "strategy", "questions", "scales", "stanTable", "tGradeTable", "summaryTable"].map((key) => [
        key,
        typeof test[key] === "object" ? JSON.stringify(test[key]) : test[key],
      ])
    ) as Parameters<typeof testContentOf>[0];

  // Scores and interpretations, without the scale definitions the result entries carry along.
  const scores = (score: unknown) =>
    JSON.parse(JSON.stringify(score, (key, value) => (key === "scale" && value ? { id: value.id, name: value.name } : value)));

  it("fits the studio's content shape", () => {
    for (const test of library) {
      expect(testContentSchema.safeParse(testContentOf(rowOf(test))).success, String(test.name)).toBe(true);
    }
  });

  it("scores the same after passing through the studio", () => {
    let scored = 0;
    for (const test of library) {
      const row = rowOf(test);
      const content = testContentOf(row);
      const questions = content.questions;
      // Three answer patterns: first choices, last choices, alternating.
      for (const pick of [0, -1, 2]) {
        const responses = questions.map((question, index) => {
          const choices = question.choices;
          const choice = pick === 2 ? choices[index % choices.length] : choices.at(pick);
          return { questionId: question.id, choiceId: choice?.id ?? 0 };
        });
        const before = scoreSubmission(row, responses);
        if (before) scored++;
        expect(scores(scoreSubmission(testColumns(content), responses)), String(test.name)).toEqual(scores(before));
      }
    }
    expect(scored).toBe(library.length * 3);
  });
});
