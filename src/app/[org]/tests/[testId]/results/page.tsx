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
import { CompareForm } from "@/components/hiring/compare-form";
import { TargetPicker } from "@/components/hiring/target-picker";
import { Button } from "@/components/ui/button";
import { chooseTarget, loadTargetProfiles } from "@/utils/hiring";
import { profileFit, targetKind } from "@/utils/target-profiles";
import Link from "next/link";

type PathParams = {
  params: Promise<{
    testId: string;
  }>;
  searchParams: Promise<{ page?: string; target?: string }>;
};

export default async function TestResultsPage(props: PathParams) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const page = pageFrom(searchParams.page);
  const base = await organizationBase();
  const t = await getTranslations("results");
  const hiring = await getTranslations("hiring");
  const section = await getTranslations("dashboard.tests");
  const { membership, organization } = await ensureMember("viewDashboard");

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

  const [users, rawTest, profiles] = await Promise.all([
    findUsersByIds([...new Set(submissions.map((submission) => submission.userId))]),
    prisma.test.findUniqueOrThrow({ where: { id: test.id } }),
    loadTargetProfiles(organization.id, test.id),
  ]);
  // Target profiles only apply to tests with a norm scale that can go to hiring.
  const targetable = targetKind(test.strategy) !== null && !test.sensitive;
  const target = targetable ? chooseTarget(profiles, searchParams.target) : null;
  const usersById = new Map(users.map((user) => [user.id, user]));
  // Each result on the page scored with the version it answered, for its profile strip.
  const testFor = await localizedTestsAsAnswered([rawTest], submissions, await getLocale());
  const resultOf = (submission: (typeof submissions)[number]) => buildTestResult(testFor(submission) ?? test, submission);

  // People who took this test can be picked on the page and compared side by side.
  const comparable = submissions.length > 1;
  const list = (
    <SubmissionList
      selectName={comparable ? "s" : undefined}
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
            fit: target ? profileFit(result.rows, target.bands) : undefined,
          },
        ];
      })}
    />
  );

  return (
    <>
      <PageHeader
        title={test.name}
        description={t("count", { count: total })}
        back={{ href: `${base}/tests`, label: section("back") }}
        actions={
          targetable && (
            <>
              <TargetPicker profiles={profiles} current={target?.id ?? null} />
              {can(membership.role, "manageRounds") && (
                <Button variant="outline" asChild>
                  <Link href={`${base}/tests/${test.id}/targets`}>{hiring("targets.title")}</Link>
                </Button>
              )}
            </>
          )
        }
      />
      {comparable ? (
        <CompareForm action={`${base}/tests/${test.id}/compare`} target={target?.id}>
          {list}
        </CompareForm>
      ) : (
        list
      )}
      <Pager page={page} pages={pageCount(total)} path={`${base}/tests/${test.id}/results`} />
    </>
  );
}
