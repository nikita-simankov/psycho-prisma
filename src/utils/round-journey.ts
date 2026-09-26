import "server-only";

import { prisma } from "./database";
import { itemKey, parseItems, submittedItems, type RoundItem } from "./rounds";

export function itemHref(item: RoundItem, assignmentId: string) {
  return `/${item.kind === "test" ? "tests" : "forms"}/${item.id}?assignment=${assignmentId}`;
}

// Where a respondent is in a round: which item this is, and where to go once it is submitted.
// Null when the assignment isn't theirs.
export async function roundJourney(assignmentId: string | undefined, userId: string, current?: RoundItem) {
  if (!assignmentId) return null;
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId },
    include: { round: { select: { name: true } } },
  });
  if (!assignment) return null;

  const items = parseItems(assignment.items);
  const done = (await submittedItems([assignment.id])).get(assignment.id) ?? new Set<string>();
  const index = current ? items.findIndex((item) => itemKey(item) === itemKey(current)) : -1;
  const next = items.find((item) => !done.has(itemKey(item)) && (!current || itemKey(item) !== itemKey(current)));

  return {
    round: assignment.round.name,
    position: index + 1,
    total: items.length,
    // The first unfinished item, or null when everything is done.
    first: items.find((item) => !done.has(itemKey(item))) ?? null,
    nextHref: next ? itemHref(next, assignment.id) : "/assessments?done=1",
  };
}
