import type {
  FormQuestion,
  StanTableRow,
  SummaryTableRow,
  TestQuestion,
  TestScale,
  TGradeTableRow,
} from "./constants";
import type { ContentOverlay } from "./content-translation";
import Formula from "fparser";

// What the studio edits and what a version snapshot stores. Everything else on a test or
// questionnaire (library, sensitivity, retest interval, translations) lives outside it.

export const STRATEGIES = ["grade", "standard-ten", "t-grade"] as const;
export type Strategy = (typeof STRATEGIES)[number];

export type TestContent = {
  name: string;
  description: string;
  instruction: string;
  ttc: number;
  strategy: Strategy;
  questions: TestQuestion[];
  scales: TestScale[];
  stanTable: StanTableRow[];
  tGradeTable: TGradeTableRow[];
  summaryTable: SummaryTableRow[];
};

export type FormContent = {
  name: string;
  description: string;
  ttc: number;
  adminOnly: boolean;
  questions: FormQuestion[];
};

export type InstrumentKind = "test" | "form";

type TestRow = {
  name: string;
  description: string;
  instruction: string;
  ttc: number;
  strategy: string;
  questions: string;
  scales: string;
  stanTable: string;
  tGradeTable: string;
  summaryTable: string;
};

type FormRow = { name: string; description: string; ttc: number; adminOnly: boolean; questions: string };

function parseArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Imported spreadsheets leave fields out or store numbers as text. Filling them in keeps scoring
// the same: a missing formula already meant none, a key without a choice never matched an answer,
// and number-like text already compared as a number.
function numberOf(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return typeof value !== "boolean" && value !== null && value !== "" && Number.isFinite(parsed) ? parsed : fallback;
}

function textOf(value: unknown) {
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

type Loose = Record<string, unknown>;

function questionsOf(value: string, types: readonly string[]) {
  return parseArray<Loose>(value).map((question) => ({
    id: numberOf(question.id),
    text: textOf(question.text),
    type: types.includes(textOf(question.type)) ? textOf(question.type) : types[0],
    choices: (Array.isArray(question.choices) ? (question.choices as Loose[]) : []).map((choice) => ({ id: numberOf(choice.id), text: textOf(choice.text) })),
  }));
}

export function testContentOf(row: TestRow): TestContent {
  return {
    name: row.name,
    description: row.description,
    instruction: row.instruction,
    ttc: row.ttc,
    strategy: (STRATEGIES as readonly string[]).includes(row.strategy) ? (row.strategy as Strategy) : "grade",
    questions: questionsOf(row.questions, ["List", "Text"]),
    scales: parseArray<Loose>(row.scales).map((scale) => ({
      ...(scale as unknown as TestScale),
      id: numberOf(scale.id),
      name: textOf(scale.name),
      keys: (Array.isArray(scale.keys) ? (scale.keys as Loose[]) : [])
        .filter((key) => numberOf(key.questionId, NaN) >= 0 && numberOf(key.choiceId, NaN) >= 0)
        .map((key) => ({ questionId: numberOf(key.questionId), choiceId: numberOf(key.choiceId), grade: numberOf(key.grade) })),
      multiplier: numberOf(scale.multiplier, 1),
      correction: numberOf(scale.correction),
      resultCalculationFormula: textOf(scale.resultCalculationFormula).trim() || "Нет",
    })),
    stanTable: parseArray<Loose>(row.stanTable).map((entry) => ({
      scaleId: numberOf(entry.scaleId),
      minGrade: numberOf(entry.minGrade),
      maxGrade: numberOf(entry.maxGrade),
      stanValue: numberOf(entry.stanValue),
    })),
    tGradeTable: parseArray<Loose>(row.tGradeTable).map((entry) => ({
      scaleId: numberOf(entry.scaleId),
      rawGrade: numberOf(entry.rawGrade),
      convertedGrade: numberOf(entry.convertedGrade),
    })),
    summaryTable: parseArray<Loose>(row.summaryTable).map((entry) => ({
      scaleId: numberOf(entry.scaleId),
      strategy: textOf(entry.strategy) || row.strategy,
      minGrade: numberOf(entry.minGrade),
      maxGrade: numberOf(entry.maxGrade),
      minTGrade: numberOf(entry.minTGrade),
      maxTGrade: numberOf(entry.maxTGrade),
      minStanValue: numberOf(entry.minStanValue),
      maxStanValue: numberOf(entry.maxStanValue),
      summaryText: textOf(entry.summaryText),
    })),
  };
}

export function formContentOf(row: FormRow): FormContent {
  return {
    name: row.name,
    description: row.description,
    ttc: row.ttc,
    adminOnly: row.adminOnly,
    questions: questionsOf(row.questions, ["List", "Text"]) as FormQuestion[],
  };
}

// The database columns for a piece of content.
export function testColumns(content: TestContent) {
  return {
    name: content.name.trim(),
    description: content.description,
    instruction: content.instruction,
    ttc: content.ttc,
    strategy: content.strategy,
    questions: JSON.stringify(content.questions),
    scales: JSON.stringify(content.scales),
    stanTable: JSON.stringify(content.stanTable),
    tGradeTable: JSON.stringify(content.tGradeTable),
    summaryTable: JSON.stringify(content.summaryTable),
  };
}

export function formColumns(content: FormContent) {
  return {
    name: content.name.trim(),
    description: content.description,
    ttc: content.ttc,
    adminOnly: content.adminOnly,
    questions: JSON.stringify(content.questions),
  };
}

export function blankTest(name: string): TestContent {
  return {
    name,
    description: "",
    instruction: "",
    ttc: 10,
    strategy: "grade",
    questions: [],
    scales: [],
    stanTable: [],
    tGradeTable: [],
    summaryTable: [],
  };
}

export function blankForm(name: string): FormContent {
  return { name, description: "", ttc: 5, adminOnly: false, questions: [] };
}

// The next free id in a list, so new questions, choices and scales never reuse an old id.
export function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export type Issue = {
  code:
    | "name"
    | "noQuestions"
    | "questionText"
    | "fewChoices"
    | "choiceText"
    | "noScales"
    | "scaleName"
    | "noKeys"
    | "unknownKey"
    | "formula"
    | "noNorms"
    | "normRange"
    | "normOverlap"
    | "noTTable"
    | "summaryRange"
    | "unknownScale";
  // 1-based positions for messages, e.g. question 3 or scale 2.
  question?: number;
  choice?: number;
  scale?: number;
  row?: number;
};

// What stops a test from being published. Checked in the editor as you type and again on the server.
export function validateTestContent(content: TestContent): Issue[] {
  const issues: Issue[] = [];
  if (!content.name.trim()) issues.push({ code: "name" });
  if (content.questions.length === 0) issues.push({ code: "noQuestions" });

  content.questions.forEach((question, index) => {
    if (!question.text.trim()) issues.push({ code: "questionText", question: index + 1 });
    if (question.choices.length < 2) issues.push({ code: "fewChoices", question: index + 1 });
    question.choices.forEach((choice, choiceIndex) => {
      if (!choice.text.trim()) issues.push({ code: "choiceText", question: index + 1, choice: choiceIndex + 1 });
    });
  });

  if (content.scales.length === 0) issues.push({ code: "noScales" });
  const scaleIds = new Set(content.scales.map((scale) => scale.id));
  const scaleNumber = (id: number) => content.scales.findIndex((scale) => scale.id === id) + 1;

  content.scales.forEach((scale, index) => {
    if (!scale.name.trim()) issues.push({ code: "scaleName", scale: index + 1 });
    const formula = hasFormula(scale);
    if (scale.keys.length === 0 && !formula) issues.push({ code: "noKeys", scale: index + 1 });
    for (const key of scale.keys) {
      const question = content.questions.find((entry) => entry.id === key.questionId);
      if (!question || !question.choices.some((choice) => choice.id === key.choiceId)) {
        issues.push({ code: "unknownKey", scale: index + 1 });
        break;
      }
    }
    if (formula && !formulaValid(scale.resultCalculationFormula, scaleIds)) {
      issues.push({ code: "formula", scale: index + 1 });
    }
  });

  if (content.strategy === "standard-ten") {
    for (const scale of content.scales) {
      const rows = content.stanTable.filter((row) => row.scaleId === scale.id).sort((a, b) => a.minGrade - b.minGrade);
      if (rows.length === 0) issues.push({ code: "noNorms", scale: scaleNumber(scale.id) });
      rows.forEach((row, index) => {
        if (row.minGrade > row.maxGrade || row.stanValue < 1 || row.stanValue > 10) {
          issues.push({ code: "normRange", scale: scaleNumber(scale.id), row: index + 1 });
        } else if (index > 0 && row.minGrade <= rows[index - 1].maxGrade) {
          issues.push({ code: "normOverlap", scale: scaleNumber(scale.id), row: index + 1 });
        }
      });
    }
  }

  if (content.strategy === "t-grade") {
    for (const scale of content.scales) {
      if (!content.tGradeTable.some((row) => row.scaleId === scale.id)) {
        issues.push({ code: "noTTable", scale: scaleNumber(scale.id) });
      }
    }
  }

  const tables = [...content.stanTable, ...content.tGradeTable, ...content.summaryTable];
  if (tables.some((row) => !scaleIds.has(row.scaleId))) issues.push({ code: "unknownScale" });

  content.summaryTable.forEach((row, index) => {
    const [min, max] =
      content.strategy === "standard-ten"
        ? [row.minStanValue, row.maxStanValue]
        : content.strategy === "t-grade"
          ? [row.minTGrade, row.maxTGrade]
          : [row.minGrade, row.maxGrade];
    if (min > max || !row.summaryText.trim()) issues.push({ code: "summaryRange", row: index + 1 });
  });

  return issues;
}

export function validateFormContent(content: FormContent): Issue[] {
  const issues: Issue[] = [];
  if (!content.name.trim()) issues.push({ code: "name" });
  if (content.questions.length === 0) issues.push({ code: "noQuestions" });
  content.questions.forEach((question, index) => {
    if (!question.text.trim()) issues.push({ code: "questionText", question: index + 1 });
    if (question.type === "List") {
      if (question.choices.length < 2) issues.push({ code: "fewChoices", question: index + 1 });
      question.choices.forEach((choice, choiceIndex) => {
        if (!choice.text.trim()) issues.push({ code: "choiceText", question: index + 1, choice: choiceIndex + 1 });
      });
    }
  });
  return issues;
}

// Imported tests use "Нет" for "no formula".
export function hasFormula(scale: Pick<TestScale, "resultCalculationFormula">) {
  const formula = scale.resultCalculationFormula?.trim();
  return Boolean(formula) && formula !== "Нет";
}

// Formulas combine scale raw scores ($1, $2…) with numbers, + − × ÷ and brackets.
export function formulaValid(formula: string, scaleIds: Set<number>) {
  const references = Array.from(formula.matchAll(/\$(\d+)/g)).map((match) => Number(match[1]));
  if (references.some((id) => !scaleIds.has(id))) return false;
  const expression = formula.replace(/\$\d+/g, "1");
  if (!/^[\d\s+\-*/().]+$/.test(expression)) return false;
  let depth = 0;
  for (const character of expression) {
    depth += character === "(" ? 1 : character === ")" ? -1 : 0;
    if (depth < 0) return false;
  }
  if (depth !== 0) return false;
  try {
    return Number.isFinite(Number(new Formula(expression).evaluate({})));
  } catch {
    return false;
  }
}

// Drops overlay entries whose original text changed, so a stale translation never shows
// next to an edited question. Untouched texts keep their translations.
export function pruneOverlays(
  before: { name: string; description: string; instruction?: string; questions: { id: number; text: string; choices?: { id: number; text: string }[] }[]; scales?: { id: number; name: string }[]; summaryTable?: { summaryText: string }[] },
  after: typeof before,
  translations: string
): string {
  let overlays: Record<string, ContentOverlay>;
  try {
    overlays = JSON.parse(translations);
  } catch {
    return "{}";
  }

  const pruned = Object.fromEntries(
    Object.entries(overlays).map(([locale, overlay]) => {
      const next: ContentOverlay = { ...overlay };
      if (before.name !== after.name) delete next.name;
      if (before.description !== after.description) delete next.description;
      if (before.instruction !== after.instruction) delete next.instruction;

      if (next.questions) {
        next.questions = Object.fromEntries(
          Object.entries(next.questions).flatMap(([id, question]) => {
            const old = before.questions.find((entry) => String(entry.id) === id);
            const current = after.questions.find((entry) => String(entry.id) === id);
            if (!old || !current) return [];
            const choices = Object.fromEntries(
              Object.entries(question.choices ?? {}).filter(([choiceId]) => {
                const oldChoice = old.choices?.find((choice) => String(choice.id) === choiceId);
                const newChoice = current.choices?.find((choice) => String(choice.id) === choiceId);
                return oldChoice && newChoice && oldChoice.text === newChoice.text;
              })
            );
            return [[id, { ...(old.text === current.text && question.text !== undefined && { text: question.text }), choices }]];
          })
        );
      }

      if (next.scales) {
        next.scales = Object.fromEntries(
          Object.entries(next.scales).filter(([id]) => {
            const old = before.scales?.find((scale) => String(scale.id) === id);
            const current = after.scales?.find((scale) => String(scale.id) === id);
            return old && current && old.name === current.name;
          })
        );
      }

      if (next.summaries) {
        const kept = new Set(after.summaryTable?.map((row) => row.summaryText));
        next.summaries = Object.fromEntries(Object.entries(next.summaries).filter(([text]) => kept.has(text)));
      }

      return [locale, next];
    })
  );

  return JSON.stringify(pruned);
}
