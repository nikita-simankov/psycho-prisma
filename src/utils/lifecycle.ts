// Rounds that start from each person's start date: once after a number of days, or every year.

const DAY = 24 * 60 * 60_000;
// A start date older than this when the rule runs is left alone, so a new rule doesn't reach
// everyone who started long ago.
export const LIFECYCLE_WINDOW_DAYS = 7;
export const LIFECYCLE_OFFSETS = [30, 90] as const;

export type LifecycleTrigger = "startDate" | "anniversary";

function parseDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
}

// When this person's round is due to start and which cycle it is, or null when it isn't due now.
export function lifecycleDue(trigger: LifecycleTrigger, offsetDays: number, startDate: string, now = new Date()) {
  const start = parseDay(startDate);
  if (!start) return null;

  if (trigger === "startDate") {
    const due = new Date(start.getTime() + offsetDays * DAY);
    return due <= now && now.getTime() - due.getTime() < LIFECYCLE_WINDOW_DAYS * DAY ? { due, cycle: 0 } : null;
  }

  const year = now.getUTCFullYear();
  for (const candidateYear of [year, year - 1]) {
    if (candidateYear <= start.getUTCFullYear()) continue;
    const due = new Date(Date.UTC(candidateYear, start.getUTCMonth(), start.getUTCDate()));
    if (due <= now && now.getTime() - due.getTime() < LIFECYCLE_WINDOW_DAYS * DAY) {
      return { due, cycle: candidateYear };
    }
  }
  return null;
}
