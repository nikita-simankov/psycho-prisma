// Ready-made rounds for the template gallery. Items are tests from the shared library; a template
// is skipped where one of its tests isn't available to the organization.

export type RoundTemplate = {
  key: string;
  purpose: "development" | "hiring" | "wellbeing";
  // Automatic start from each person's start date, when the template is meant for new people.
  repeat?: "start30" | "start90" | "anniversary" | "3" | "6" | "12";
  dueDays: number;
  tests: string[];
};

const TESTS = {
  analogies: "3f57e760-9261-4d7c-8154-635bf0b4dc4e",
  arithmetic: "6f43dd54-388b-4088-9a0c-ad8f49d23031",
  patterns: "41742e8f-a9c2-4427-a9b1-b249ca30cc74",
  communication: "f80c5f1e-6ca0-4c2b-bb98-50d3275f4c43",
  leadership: "a4d5d8eb-76e1-4ced-b534-5cbee4b5f8c2",
  risk: "9c2d7121-afce-4125-8895-4779d9e03ea8",
  mentalStates: "9c1fb2c2-4a52-4c7f-b34f-4f07a7ef7723",
  stress: "5812bacd-c9f1-4757-a0a9-b7e0413e7baa",
};

export const ROUND_TEMPLATES: RoundTemplate[] = [
  { key: "newStarter", purpose: "development", repeat: "start30", dueDays: 14, tests: [TESTS.communication, TESTS.risk] },
  { key: "leadership", purpose: "development", dueDays: 14, tests: [TESTS.leadership, TESTS.communication, TESTS.risk] },
  { key: "annual", purpose: "development", repeat: "anniversary", dueDays: 21, tests: [TESTS.leadership, TESTS.communication] },
  { key: "reasoning", purpose: "hiring", dueDays: 7, tests: [TESTS.analogies, TESTS.arithmetic, TESTS.patterns] },
  { key: "pulse", purpose: "wellbeing", repeat: "3", dueDays: 7, tests: [TESTS.mentalStates, TESTS.stress] },
];
