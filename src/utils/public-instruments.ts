// Instruments from the shared library that have a public page at /instruments/<slug>.
// Clinical (sensitive) instruments are left out on purpose: they are only for psychologists,
// and their pages would put screening items for depression or suicide risk in search results.
// Items are never shown publicly, only what an instrument measures and how it is used.

export type PublicInstrument = {
  slug: string;
  // The Test id in the shared library (prisma/seed-data/tests.json).
  testId: string;
  kind: "ability" | "personality";
  questions: number;
  minutes: number;
};

export const PUBLIC_INSTRUMENTS: PublicInstrument[] = [
  { slug: "analogies", testId: "3f57e760-9261-4d7c-8154-635bf0b4dc4e", kind: "ability", questions: 30, minutes: 5 },
  { slug: "arithmetic", testId: "6f43dd54-388b-4088-9a0c-ad8f49d23031", kind: "ability", questions: 30, minutes: 8 },
  { slug: "patterns", testId: "41742e8f-a9c2-4427-a9b1-b249ca30cc74", kind: "ability", questions: 30, minutes: 5 },
  { slug: "communication-and-organisation", testId: "f80c5f1e-6ca0-4c2b-bb98-50d3275f4c43", kind: "personality", questions: 40, minutes: 5 },
  { slug: "leadership", testId: "a4d5d8eb-76e1-4ced-b534-5cbee4b5f8c2", kind: "personality", questions: 50, minutes: 5 },
  { slug: "risk-readiness", testId: "9c2d7121-afce-4125-8895-4779d9e03ea8", kind: "personality", questions: 25, minutes: 5 },
];

export function findPublicInstrument(slug: string) {
  return PUBLIC_INSTRUMENTS.find((instrument) => instrument.slug === slug);
}
