"use server";

import { requireMember } from "@/utils/authentication";
import { localizeCategory } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { allowedSubmissionWhere } from "@/utils/library";
import { memberInclude, toMember } from "@/utils/user";
import { getLocale } from "next-intl/server";

// The latest results the viewer may see, with the person and the test's name in their language.
export async function findRecentTestSubmissions(limit: number) {
  const context = await requireMember("viewDashboard");

  const submissions = await prisma.testSubmission.findMany({
    where: await allowedSubmissionWhere(context),
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit,
    select: { id: true, userId: true, testId: true, createdAt: true },
  });

  const [memberships, tests, locale] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: context.organization.id, userId: { in: submissions.map((s) => s.userId) } },
      include: memberInclude,
    }),
    prisma.test.findMany({
      where: { id: { in: submissions.map((s) => s.testId) } },
      select: { id: true, name: true, translations: true },
    }),
    getLocale(),
  ]);
  const users = new Map(memberships.map((m) => [m.userId, toMember(m, context.membership.role)]));
  const testNames = new Map(tests.map((test) => [test.id, localizeCategory(test, locale).name]));

  return submissions.flatMap((submission) => {
    const user = users.get(submission.userId);
    const testName = testNames.get(submission.testId);
    return user && testName ? [{ submission, user, testName }] : [];
  });
}
