"use server";

import { AuthorizationError, requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { completeIfDone, openAssignmentFor } from "@/utils/rounds";
import { scoreSubmission } from "@/utils/scoring";
import { cleanTimings, deleteDraft } from "@/utils/drafts";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ questionId: z.number(), choiceId: z.number() }))
  .max(2000);

export async function uploadTestSubmission(testId: string, submission: unknown, assignmentId?: string, timings?: unknown) {
  const { user, membership, organization } = await requireMember();
  const responses = responsesSchema.parse(submission);
  const id = z.string().parse(testId);
  const assignment = await openAssignmentFor(
    user.id,
    organization.id,
    { kind: "test", id },
    z.string().optional().parse(assignmentId)
  );

  // Respondents answer only what was sent to them; staff can also try any test.
  if (!assignment && !can(membership.role, "viewDashboard")) {
    throw new AuthorizationError("Forbidden");
  }

  const test = await prisma.test.findFirstOrThrow({ where: { id, AND: [libraryWhere(organization.id)] } });
  const score = scoreSubmission(test, responses);

  const created = await prisma.testSubmission.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      testId: test.id,
      assignmentId: assignment?.id,
      timings: cleanTimings(timings),
      summary: score ? JSON.stringify(score.result) : "",
      submission: JSON.stringify(responses),
    },
  });

  await deleteDraft(user.id, organization.id, "test", id);

  if (assignment) {
    await completeIfDone(assignment.id);
  }

  return { id: created.id, testId: created.testId };
}
