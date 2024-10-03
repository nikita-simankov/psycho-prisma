export const COOKIE_NAME = "auth_cookie";

export type ChoiceType = "Text" | "List";

export type FormData = {
  name: string;
  questions: FormQuestion[];
  description: string;
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
