"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { z } from "zod";

const responsesSchema = z
  .array(z.object({ fieldId: z.number(), response: z.string().max(10_000) }))
  .max(1000);

export async function uploadFormSubmission(formId: string, submission: unknown) {
  const { user, membership, organization } = await requireMember();
  const responses = responsesSchema.parse(submission);
  const staff = can(membership.role, "viewDashboard");

  const form = await prisma.form.findFirstOrThrow({
    where: {
      id: z.string().parse(formId),
      AND: [libraryWhere(organization.id), staff ? {} : { adminOnly: false }],
    },
    select: { id: true },
  });

  const created = await prisma.formSubmission.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      formId: form.id,
      submission: JSON.stringify(responses),
    },
  });

  return { id: created.id, formId: created.formId };
}
