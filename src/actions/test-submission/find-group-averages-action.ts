"use server";

import { requireMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { latestGroupAverages } from "@/utils/group-averages";
import { libraryWhere } from "@/utils/library";
import { can } from "@/utils/roles";
import { getLocale } from "next-intl/server";
import { z } from "zod";

// Team and organization averages for one test, from each person's latest result.
export async function findGroupAverages(testId: unknown) {
  const { membership, organization } = await requireMember("viewDashboard");
  const test = await prisma.test.findFirst({
    where: { id: z.string().parse(testId), AND: [libraryWhere(organization.id)] },
  });

  if (!test || (test.sensitive && !can(membership.role, "viewSensitive"))) {
    return null;
  }

  return latestGroupAverages(organization.id, localizeTest(test, await getLocale()));
}
