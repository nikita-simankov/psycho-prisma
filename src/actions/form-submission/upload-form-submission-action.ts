"use server";

import { prisma } from "@/utils/database";
import { useSession } from "@/utils/authentication";
import { FormQuestionResponse } from "@/utils/constants";

export async function uploadFormSubmission(
  formId: string,
  submission: FormQuestionResponse[]
) {
  const user = await useSession();

  return await prisma.formSubmission.create({
    data: {
      userId: user?.id!,
      formId: formId,
      submission: JSON.stringify(submission),
    },
  });
}
