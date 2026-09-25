"use server";

import { requireMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { openAssignmentFor } from "@/utils/rounds";
import { getLocale } from "next-intl/server";

// Staff can open any test in the library; everyone else only tests sent to them in an open round.
export async function findTestById(testId: string) {
  const { user, membership, organization } = await requireMember();

  if (
    !can(membership.role, "viewDashboard") &&
    !(await openAssignmentFor(user.id, organization.id, { kind: "test", id: testId }))
  ) {
    return null;
  }

  const test = await prisma.test.findFirst({ where: { id: testId, AND: [libraryWhere(organization.id)] } });

  return test && localizeTest(test, await getLocale());
}
