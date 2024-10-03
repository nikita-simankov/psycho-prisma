"use server";

import { prisma } from "@/utils/database";
import { useSession } from "@/utils/authentication";
import { TestQuestionResponse } from "@/utils/constants";

export async function uploadTestSubmission(
  testId: string,
  submission: TestQuestionResponse[]
) {
  const user = await useSession();

  return await prisma.testSubmission.create({
    data: {
      userId: user?.id!,
      testId: testId,
      summary: "",
      submission: JSON.stringify(submission),
    },
  });
}
