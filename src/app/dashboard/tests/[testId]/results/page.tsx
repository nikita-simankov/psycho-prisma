import { findAllTestSubmissionsByTestId } from "@/actions/test-submission/find-all-test-submissions-by-test-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { SubmissionList } from "@/components/submission-list";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function TestResultsPage({ params }: PathParams) {
  const t = await getTranslations("results");
  const section = await getTranslations("dashboard.tests");
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
        back={{ href: "/dashboard/tests", label: section("back") }}
      />
      <SubmissionList
        items={submissions.flatMap((submission) => {
          const user = usersById.get(submission.userId);

          return user
            ? [
                {
                  id: submission.id,
                  href: `/dashboard/tests/${test.id}/results/${submission.id}`,
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
