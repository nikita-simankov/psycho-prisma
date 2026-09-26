"use server";

import { AuthorizationError, requireMember } from "@/utils/authentication";
import { assertConsented } from "@/utils/consent";
import { prisma } from "@/utils/database";
import { can } from "@/utils/roles";
import { openAssignmentFor } from "@/utils/rounds";
import { z } from "zod";

const draftSchema = z
  .object({
    answers: z.record(z.union([z.number(), z.string().max(10_000)])),
    timings: z.record(z.number().int().min(0)),
    assignmentId: z.string().optional(),
  })
  .strict();

// Keeps answers in progress on the server, so closing the tab or switching devices loses nothing.
export async function saveDraft(kind: unknown, instrumentId: unknown, data: unknown) {
  const { user, membership, organization } = await requireMember();
  assertConsented(membership);
  const item = { kind: z.enum(["test", "form"]).parse(kind), id: z.string().parse(instrumentId) };
  const draft = draftSchema.parse(data);

  if (Object.keys(draft.answers).length > 2000) {
    throw new Error("Too many answers");
  }

  const assignment = await openAssignmentFor(user.id, organization.id, item, draft.assignmentId);
  if (!assignment && !can(membership.role, "viewDashboard")) {
    throw new AuthorizationError("Forbidden");
  }

  const key = { userId: user.id, organizationId: organization.id, kind: item.kind, instrumentId: item.id };
  const values = {
    assignmentId: assignment?.id ?? null,
    answers: JSON.stringify(draft.answers),
    timings: JSON.stringify(draft.timings),
  };

  await prisma.draft.upsert({
    where: { userId_organizationId_kind_instrumentId: key },
    create: { ...key, ...values },
    update: values,
  });

  return { savedAt: new Date() };
}

export async function discardDraft(kind: unknown, instrumentId: unknown) {
  const { user, organization } = await requireMember();
  await prisma.draft.deleteMany({
    where: {
      userId: user.id,
      organizationId: organization.id,
      kind: z.enum(["test", "form"]).parse(kind),
      instrumentId: z.string().parse(instrumentId),
    },
  });
}
