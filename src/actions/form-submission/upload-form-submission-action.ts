"use server";

import { AuthorizationError, requireMember } from "@/utils/authentication";
import { assertConsented } from "@/utils/consent";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { completeIfDone, openAssignmentFor } from "@/utils/rounds";
import { cleanTimings, deleteDraft } from "@/utils/drafts";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ fieldId: z.number(), response: z.string().max(10_000) }))
  .max(1000);

export async function uploadFormSubmission(formId: string, submission: unknown, assignmentId?: string, timings?: unknown) {
  const { user, membership, organization } = await requireMember();
  assertConsented(membership);
  const responses = responsesSchema.parse(submission);
  const id = z.string().parse(formId);
  const staff = can(membership.role, "viewDashboard");
  const assignment = await openAssignmentFor(
    user.id,
    organization.id,
    { kind: "form", id },
    z.string().optional().parse(assignmentId)
  );

  // Respondents answer only what was sent to them; staff can also fill in any questionnaire.
  if (!assignment && !staff) {
    throw new AuthorizationError("Forbidden");
  }

  const form = await prisma.form.findFirstOrThrow({
    where: { id, AND: [libraryWhere(organization.id), staff ? {} : { adminOnly: false }] },
    select: { id: true, version: true },
  });

  const created = await prisma.formSubmission.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      formId: form.id,
      formVersion: form.version,
      assignmentId: assignment?.id,
      timings: cleanTimings(timings),
      submission: JSON.stringify(responses),
    },
  });

  await deleteDraft(user.id, organization.id, "form", id);

  if (assignment) {
    await completeIfDone(assignment.id);
  }

  return { id: created.id, formId: created.formId };
}
