// How a round is doing: done, overdue, at risk (time is running out faster than people finish)
// or on track. Rounds without a due date are on track until they are closed.
export type RoundHealth = "done" | "overdue" | "atRisk" | "onTrack";

export function roundHealth(
  round: { createdAt: Date; dueAt: Date | null; closedAt: Date | null },
  stats: { people: number; completed: number },
  now = new Date()
): RoundHealth {
  if (stats.people > 0 && stats.completed >= stats.people) return "done";
  if (!round.dueAt || round.closedAt) return "onTrack";
  if (round.dueAt < now) return "overdue";
  const total = round.dueAt.getTime() - round.createdAt.getTime();
  const elapsed = total > 0 ? (now.getTime() - round.createdAt.getTime()) / total : 1;
  const finished = stats.people ? stats.completed / stats.people : 1;
  // Past half-way with less than half of the time's share done, or in the last day with most still open.
  const lastDay = round.dueAt.getTime() - now.getTime() < 24 * 60 * 60_000;
  return (elapsed > 0.5 && finished < elapsed - 0.35) || (lastDay && finished < 0.5) ? "atRisk" : "onTrack";
}

// Minutes above which a round asks too much of each person.
export const TIME_BUDGET_WARNING = 45;
