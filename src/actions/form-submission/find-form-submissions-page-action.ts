"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedFormSubmissionWhere } from "@/utils/library";
import { pageWindow } from "@/utils/pagination";

// One page of a questionnaire's answers, newest first, with the total for the pager.
export async function findFormSubmissionsPage(formId: string, page: number) {
  const context = await requireMember("viewDashboard");
  const where = { AND: [allowedFormSubmissionWhere(context), { formId }] };

  const [items, total] = await Promise.all([
    prisma.formSubmission.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], ...pageWindow(page) }),
    prisma.formSubmission.count({ where }),
  ]);
  return { items, total };
}
