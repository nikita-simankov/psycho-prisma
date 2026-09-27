"use server";

import { AuthorizationError, requireMember } from "@/utils/authentication";
import { assertConsented } from "@/utils/consent";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { completeIfDone, openAssignmentFor } from "@/utils/rounds";
import { scoreSubmission, toScaleRows } from "@/utils/scoring";
import { cleanTimings, deleteDraft } from "@/utils/drafts";
import { careCheck } from "@/utils/care";
import { recordPulseAnswer } from "@/utils/pulse";
import type { Support } from "@/utils/wellbeing";
import { getLocale } from "next-intl/server";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ questionId: z.number(), choiceId: z.number() }))
  .max(2000);

// Saves the answers and returns the support to show straight away when the result crosses one
// of the organization's wellbeing rules (src/utils/care.ts). Answers to an anonymous round are kept
// without the person, so they return no id.
export async function uploadTestSubmission(
  testId: string,
  submission: unknown,
  assignmentId?: string,
  timings?: unknown
): Promise<{ id: string | null; testId: string; support: Support | null }> {
  const { user, membership, organization } = await requireMember();
  assertConsented(membership);
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
  const summary = score ? JSON.stringify(score.result) : "";
  const rows = toScaleRows(score?.result ?? []);
  const round = assignment ? await prisma.round.findUniqueOrThrow({ where: { id: assignment.roundId }, select: { anonymous: true } }) : null;

  if (assignment && round?.anonymous) {
    await recordPulseAnswer({
      organizationId: organization.id,
      roundId: assignment.roundId,
      assignmentId: assignment.id,
      teamId: membership.teamId,
      test,
      summary,
      submission: JSON.stringify(responses),
    });
    await deleteDraft(user.id, organization.id, "test", id);
    await completeIfDone(assignment.id);
    const support = await careCheck({ organization, userId: null, testId: test.id, submissionId: null, rows });
    return { id: null, testId: test.id, support };
  }

  const created = await prisma.testSubmission.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      testId: test.id,
      testVersion: test.version,
      assignmentId: assignment?.id,
      timings: cleanTimings(timings),
      locale: await getLocale(),
      summary,
      submission: JSON.stringify(responses),
    },
  });

  await deleteDraft(user.id, organization.id, "test", id);

  if (assignment) {
    await completeIfDone(assignment.id);
  }

  // Only answers sent in a round are checked; staff trying a test raise nothing.
  const support = assignment ? await careCheck({ organization, userId: user.id, testId: test.id, submissionId: created.id, rows }) : null;

  return { id: created.id, testId: created.testId, support };
}
