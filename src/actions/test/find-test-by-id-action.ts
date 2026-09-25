"use server";

import { requireMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { getLocale } from "next-intl/server";

export async function findTestById(testId: string) {
  const { membership, organization } = await requireMember();
  const staff = can(membership.role, "viewDashboard");

  const test = await prisma.test.findFirst({
    where: { id: testId, AND: [libraryWhere(organization.id), staff ? {} : { sensitive: false }] },
  });

  return test && localizeTest(test, await getLocale());
}
