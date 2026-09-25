import "server-only";

import { prisma } from "./database";

export type DraftState = { answers: Record<string, number | string>; timings: Record<string, number> };

// The person's saved progress on an instrument, if any.
export async function findDraft(userId: string, organizationId: string, kind: "test" | "form", instrumentId: string) {
  const draft = await prisma.draft.findUnique({
    where: { userId_organizationId_kind_instrumentId: { userId, organizationId, kind, instrumentId } },
  });

  if (!draft) {
    return null;
  }

  try {
    return { answers: JSON.parse(draft.answers), timings: JSON.parse(draft.timings) } as DraftState;
  } catch {
    return null;
  }
}

export async function deleteDraft(userId: string, organizationId: string, kind: "test" | "form", instrumentId: string) {
  await prisma.draft.deleteMany({ where: { userId, organizationId, kind, instrumentId } });
}

// Only whole, non-negative millisecond counts per question survive into the submission.
export function cleanTimings(value: unknown): string {
  if (!value || typeof value !== "object") return "{}";
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([key, ms]) => /^\d+$/.test(key) && typeof ms === "number" && Number.isFinite(ms) && ms >= 0
  );
  return JSON.stringify(Object.fromEntries(entries.slice(0, 2000).map(([key, ms]) => [key, Math.round(ms as number)])));
}
