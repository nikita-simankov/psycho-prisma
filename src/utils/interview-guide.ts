import { normPosition, type NormScale } from "./norms";
import type { ScaleRow } from "./scoring";
import { bandsByScale, type TargetBand } from "./target-profiles";

// Follow-up interview questions for one result: scales outside the target profile's range first,
// then scales at either end of the norm scale. Each topic uses the organization's own questions
// for that scale when the profile has them, otherwise the generic ones.

export const MAX_TOPICS = 6;

// Scores this far out count as extreme even without a target: stens 1–2 and 9–10, T ≤ 30 and ≥ 70.
const EXTREMES: Record<NormScale, { low: number; high: number }> = {
  sten: { low: 2, high: 9 },
  t: { low: 30, high: 70 },
};

export type TopicReason = "belowTarget" | "aboveTarget" | "extremeLow" | "extremeHigh";

export type InterviewTopic = {
  scaleId: number;
  scaleName: string;
  value: number;
  kind: NormScale;
  reason: TopicReason;
  direction: "low" | "high";
  // The profile's own questions for this direction; empty means use the generic ones.
  questions: string[];
};

function lines(text: string | undefined) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function interviewTopics(rows: ScaleRow[], bands: TargetBand[] = [], max = MAX_TOPICS): InterviewTopic[] {
  const targets = bandsByScale(bands);
  const topics = rows.flatMap((row) => {
    const position = normPosition(row);
    if (!position) return [];
    const band = targets.get(row.scaleId);
    const extreme = EXTREMES[position.kind];
    let reason: TopicReason | null = null;
    // How far outside the range or into the extreme the score is, in parts of the scale, for order.
    let gap = 0;
    const span = position.max - position.min;

    if (band && position.value < band.min) {
      reason = "belowTarget";
      gap = (band.min - position.value) / span;
    } else if (band && position.value > band.max) {
      reason = "aboveTarget";
      gap = (position.value - band.max) / span;
    } else if (position.value <= extreme.low) {
      reason = "extremeLow";
      gap = (extreme.low - position.value + 1) / span;
    } else if (position.value >= extreme.high) {
      reason = "extremeHigh";
      gap = (position.value - extreme.high + 1) / span;
    }
    if (!reason) return [];

    const direction = reason === "belowTarget" || reason === "extremeLow" ? "low" : "high";
    return [
      {
        topic: {
          scaleId: row.scaleId,
          scaleName: row.scaleName,
          value: position.value,
          kind: position.kind,
          reason,
          direction,
          questions: lines(direction === "low" ? band?.low : band?.high),
        } satisfies InterviewTopic,
        // Outside the target always comes before a mere extreme.
        rank: (reason === "belowTarget" || reason === "aboveTarget" ? 1 : 0) + gap,
      },
    ];
  });

  return topics
    .sort((a, b) => b.rank - a.rank)
    .slice(0, max)
    .map((entry) => entry.topic);
}
