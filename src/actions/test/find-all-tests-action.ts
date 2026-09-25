"use server";

import { requireMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { getLocale } from "next-intl/server";

// Staff see the whole library; respondents never see sensitive screens.
export async function findAllTests() {
  const { membership, organization } = await requireMember();
  const staff = can(membership.role, "viewDashboard");

  const [tests, locale] = await Promise.all([
    prisma.test.findMany({
      where: { AND: [libraryWhere(organization.id), staff ? {} : { sensitive: false }] },
      include: { categories: true },
    }),
    getLocale(),
  ]);

  return tests.map((test) => localizeTest(test, locale));
}
