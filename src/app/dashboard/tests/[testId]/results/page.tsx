import { findAllTestSubmissionsByTestId } from "@/actions/test-submission/find-all-test-submissions-by-test-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { SubmissionList } from "@/components/submission-list";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function TestResultsPage({ params }: PathParams) {
  const t = await getTranslations("results");
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
    <div className="p-12 flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-wide">
        {t("testTitle", { name: test.name })}
      </h1>
      <Separator />
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
    </div>
  );
}
