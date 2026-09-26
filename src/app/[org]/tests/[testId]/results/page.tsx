import { findTestSubmissionsPage } from "@/actions/test-submission/find-test-submissions-page-action";
import { Pager } from "@/components/pager";
import { pageCount, pageFrom } from "@/utils/pagination";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUsersByIds } from "@/actions/user/find-all-users-action";
import { SubmissionList } from "@/components/submission-list";
import { PageHeader } from "@/components/page-header";
import { findGroupAverages } from "@/actions/test-submission/find-group-averages-action";
import { TeamAverages } from "@/components/results/team-averages";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { localizedTestsAsAnswered } from "@/utils/instrument-versions";
import { buildTestResult } from "@/utils/results";
import { can } from "@/utils/roles";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

type PathParams = {
  params: Promise<{
    testId: string;
  }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function TestResultsPage(props: PathParams) {
  const params = await props.params;
  const page = pageFrom((await props.searchParams).page);
  const base = await organizationBase();
  const t = await getTranslations("results");
  const section = await getTranslations("dashboard.tests");
  const { membership } = await ensureMember("viewDashboard");

  // Roles without access to individual results see team averages instead.
  if (!can(membership.role, "viewIndividualResults")) {
    const [test, averages] = await Promise.all([findTestById(params.testId), findGroupAverages(params.testId)]);
    if (!test || !averages) {
      notFound();
    }
    return (
      <>
        <PageHeader title={test.name} description={t("averagesTitle")} back={{ href: `${base}/tests`, label: section("back") }} />
        <TeamAverages groups={averages.groups} hidden={averages.hidden} />
      </>
    );
  }

  const [test, { items: submissions, total }] = await Promise.all([
    findTestById(params.testId),
    findTestSubmissionsPage(params.testId, page),
  ]);

  if (!test) {
    notFound();
  }

  const [users, rawTest] = await Promise.all([
    findUsersByIds([...new Set(submissions.map((submission) => submission.userId))]),
    prisma.test.findUniqueOrThrow({ where: { id: test.id } }),
  ]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  // Each result on the page scored with the version it answered, for its profile strip.
  const testFor = await localizedTestsAsAnswered([rawTest], submissions, await getLocale());
  const resultOf = (submission: (typeof submissions)[number]) => buildTestResult(testFor(submission) ?? test, submission);

  return (
    <>
      <PageHeader
        title={test.name}
        description={t("count", { count: total })}
        back={{ href: `${base}/tests`, label: section("back") }}
      />
      <SubmissionList
        items={submissions.flatMap((submission) => {
          const user = usersById.get(submission.userId);
          if (!user) return [];
          const result = resultOf(submission);

          return [
            {
              id: submission.id,
              href: `${base}/tests/${test.id}/results/${submission.id}`,
              createdAt: submission.createdAt,
              user,
              profile: result.rows,
              quality: result.quality,
            },
          ];
        })}
      />
      <Pager page={page} pages={pageCount(total)} path={`${base}/tests/${test.id}/results`} />
    </>
  );
}
