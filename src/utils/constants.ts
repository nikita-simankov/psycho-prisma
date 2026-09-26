export const COOKIE_NAME = "auth_cookie";
// Which of the signed-in person's organizations the dashboard shows.
export const ORGANIZATION_COOKIE = "active_org";
// Set by the proxy (src/proxy.ts) on requests under /[org] to the slug in the URL.
export const ORGANIZATION_HEADER = "x-organization";
// Top-level paths that can never be an organization's slug.
export const RESERVED_SLUGS = new Set([
  "account", "api", "assessments", "auth", "consent", "dashboard", "design", "forms", "invite", "link-expired",
  "organizations", "privacy", "r", "tests", "settings", "admin", "app", "help", "static", "_next",
  "product", "pricing", "instruments", "security", "legal", "start", "join", "verify-email",
]);

export type ChoiceType = "Text" | "List";

export type FormData = {
  name: string;
  questions: FormQuestion[];
  description: string;
  adminOnly: boolean;
};

export type FormQuestion = {
  id: number;
  text: string;
  type: ChoiceType;
  choices: FormQuestionChoice[];
};

export type FormQuestionChoice = {
  id: number;
  text: string;
};

export type FormQuestionResponse = {
  fieldId: number;
  response: string;
};

export type TestData = {
  name: string;
  strategy: string;
  description: string;
  instruction: string;

  scales: TestScale[];
  questions: TestQuestion[];
  questionsResponses: TestQuestionResponse[];

  stanTable: StanTableRow[];
  tGradeTable: TGradeTableRow[];
  summaryTable: SummaryTableRow[];
};

export type TestScale = {
  id: number;
  name: string;
  keys: TestScaleKey[];
  multiplier: number;
  correction: number;
  resultCalculationFormula: string;
  // Set on lie, sincerity and other validity scales; see src/utils/validity.ts.
  validity?: ValidityRule;
};

export type ValidityRule = {
  // Which score the cut-off applies to: the raw grade (after any formula), the sten or the T-score.
  measure: "grade" | "stan" | "tGrade";
  // Scores above this make the answers questionable. Without it the score is shown with no verdict.
  max?: number;
};

export type TestScaleKey = {
  questionId: number;
  choiceId: number;
  grade: number;
};

export type TestQuestion = {
  id: number;
  text: string;
  type: string;
  choices: TestQuestionChoice[];
};

export type TestQuestionChoice = {
  id: number;
  text: string;
};

export type TestQuestionResponse = {
  questionId: number;
  choiceId: number;
};

export type StanTableRow = {
  scaleId: number;
  minGrade: number;
  maxGrade: number;
  stanValue: number;
};

export type TGradeTableRow = {
  scaleId: number;
  rawGrade: number;
  convertedGrade: number;
};

export type SummaryTableRow = {
  scaleId: number;
  strategy: string;
  minGrade: number;
  maxGrade: number;
  minTGrade: number;
  maxTGrade: number;
  minStanValue: number;
  maxStanValue: number;
  summaryText: string;
};
