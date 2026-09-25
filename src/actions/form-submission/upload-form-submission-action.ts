"use server";

import { AuthorizationError, requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { completeIfDone, openAssignmentFor } from "@/utils/rounds";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ fieldId: z.number(), response: z.string().max(10_000) }))
  .max(1000);

export async function uploadFormSubmission(formId: string, submission: unknown, assignmentId?: string) {
  const { user, membership, organization } = await requireMember();
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
    select: { id: true },
  });

  const created = await prisma.formSubmission.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      formId: form.id,
      assignmentId: assignment?.id,
      submission: JSON.stringify(responses),
    },
  });

  if (assignment) {
    await completeIfDone(assignment.id);
  }

  return { id: created.id, formId: created.formId };
}
