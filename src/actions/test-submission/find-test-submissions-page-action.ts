"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere } from "@/utils/library";
import { pageWindow } from "@/utils/pagination";

// One page of a test's results, newest first, with the total for the pager.
export async function findTestSubmissionsPage(testId: string, page: number) {
  const context = await requireMember("viewDashboard");
  const where = { AND: [await allowedSubmissionWhere(context), { testId }] };

  const [items, total] = await Promise.all([
    prisma.testSubmission.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], ...pageWindow(page) }),
    prisma.testSubmission.count({ where }),
  ]);
  return { items, total };
}
