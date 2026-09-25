"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { scoreSubmission } from "@/utils/scoring";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ questionId: z.number(), choiceId: z.number() }))
  .max(2000);

export async function uploadTestSubmission(testId: string, submission: unknown) {
  const { user, membership, organization } = await requireMember();
  const responses = responsesSchema.parse(submission);
  const staff = can(membership.role, "viewDashboard");

  const test = await prisma.test.findFirstOrThrow({
    where: {
      id: z.string().parse(testId),
      AND: [libraryWhere(organization.id), staff ? {} : { sensitive: false }],
    },
  });

  const score = scoreSubmission(test, responses);

  const created = await prisma.testSubmission.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      testId: test.id,
      summary: score ? JSON.stringify(score.result) : "",
      submission: JSON.stringify(responses),
    },
  });

  return { id: created.id, testId: created.testId };
}
