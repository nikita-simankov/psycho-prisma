import type { TestQuestion, TestQuestionResponse } from "./constants";

export type QualityWarning =
  | { kind: "sameAnswer"; share: number }
  | { kind: "tooFast"; secondsPerAnswer: number }
  | { kind: "missing"; count: number }
  | { kind: "language"; locale: string };

// Below these, a pattern is too short to mean anything.
const MIN_QUESTIONS = 10;
const SAME_ANSWER_SHARE = 0.9;
// Median time per answer below which reading the statements is implausible.
const FAST_MEDIAN_MS = 1500;
// The instruments' norms were collected in Russian.
const NORM_LOCALE = "ru";

// Signs that answers may not reflect the person: one answer for nearly everything, answering
// faster than anyone can read, unanswered questions, or answering in a language the norms weren't made for.
export function answerQuality(
  questions: Pick<TestQuestion, "id">[],
  responses: TestQuestionResponse[],
  timings: Record<string, number>,
  locale: string
): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  const answered = new Set(responses.map((response) => response.questionId));
  const missing = questions.filter((question) => !answered.has(question.id)).length;

  if (responses.length >= MIN_QUESTIONS) {
    const counts = new Map<number, number>();
    for (const response of responses) counts.set(response.choiceId, (counts.get(response.choiceId) ?? 0) + 1);
    const share = Math.max(...Array.from(counts.values())) / responses.length;
    if (share >= SAME_ANSWER_SHARE) warnings.push({ kind: "sameAnswer", share: Math.round(share * 100) });
  }

  const times = Object.values(timings).filter((ms) => ms > 0).sort((a, b) => a - b);
  if (times.length >= MIN_QUESTIONS) {
    const median = times[Math.floor(times.length / 2)];
    if (median < FAST_MEDIAN_MS) warnings.push({ kind: "tooFast", secondsPerAnswer: Math.round(median / 100) / 10 });
  }

  if (missing > 0) warnings.push({ kind: "missing", count: missing });
  if (locale && locale !== NORM_LOCALE) warnings.push({ kind: "language", locale });

  return warnings;
}
