"use server";

import { requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { scoreSubmission } from "@/utils/scoring";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ questionId: z.number(), choiceId: z.number() }))
  .max(2000);

export async function uploadTestSubmission(testId: string, submission: unknown) {
  const user = await requireUser();
  const responses = responsesSchema.parse(submission);

  const test = await prisma.test.findUniqueOrThrow({
    where: { id: z.string().parse(testId) },
  });

  const score = scoreSubmission(test, responses);

  const created = await prisma.testSubmission.create({
    data: {
      userId: user.id,
      testId: test.id,
      summary: score ? JSON.stringify(score.result) : "",
      submission: JSON.stringify(responses),
    },
  });

  return { id: created.id, testId: created.testId };
}
