import { findAllTestSubmissionsByTestId } from "@/actions/test-submission/find-all-test-submissions-by-test-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { SubmissionList } from "@/components/submission-list";
import { PageHeader } from "@/components/page-header";
import { findGroupAverages } from "@/actions/test-submission/find-group-averages-action";
import { TeamAverages } from "@/components/results/team-averages";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function TestResultsPage({ params }: PathParams) {
  const base = organizationBase();
  const t = await getTranslations("results");
  const section = await getTranslations("dashboard.tests");
  const { membership } = await ensureMember("viewDashboard");

  // Roles without access to individual results see team averages instead.
  if (!can(membership.role, "viewIndividualResults")) {
    const [test, groups] = await Promise.all([findTestById(params.testId), findGroupAverages(params.testId)]);
    if (!test || !groups) {
      notFound();
    }
    return (
      <>
        <PageHeader title={test.name} description={t("averagesTitle")} back={{ href: `${base}/tests`, label: section("back") }} />
        <TeamAverages groups={groups} />
      </>
    );
  }

  const [test, submissions, users] = await Promise.all([
    findTestById(params.testId),
    findAllTestSubmissionsByTestId(params.testId),
    findAllUsers(),
  ]);

  if (!test) {
    notFound();
  }

  const usersById = new Map(users.map((user) => [user.id, user]));

  return (
    <>
      <PageHeader
        title={test.name}
        description={t("count", { count: submissions.length })}
        back={{ href: `${base}/tests`, label: section("back") }}
      />
      <SubmissionList
        items={submissions.flatMap((submission) => {
          const user = usersById.get(submission.userId);

          return user
            ? [
                {
                  id: submission.id,
                  href: `${base}/tests/${test.id}/results/${submission.id}`,
                  createdAt: submission.createdAt,
                  user,
                },
              ]
            : [];
        })}
      />
    </>
  );
}
