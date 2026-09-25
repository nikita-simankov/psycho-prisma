"use server";

import { requireUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ fieldId: z.number(), response: z.string().max(10_000) }))
  .max(1000);

export async function uploadFormSubmission(formId: string, submission: unknown) {
  const user = await requireUser();
  const responses = responsesSchema.parse(submission);

  const form = await prisma.form.findUniqueOrThrow({
    where: { id: z.string().parse(formId) },
    select: { id: true, adminOnly: true },
  });

  if (form.adminOnly && user.role !== "admin") {
    throw new Error("Forbidden");
  }

  const created = await prisma.formSubmission.create({
    data: {
      userId: user.id,
      formId: form.id,
      submission: JSON.stringify(responses),
    },
  });

  return { id: created.id, formId: created.formId };
}
