import { findTestSubmissionById } from "@/actions/test-submission/find-test-submission-by-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { PageHeader } from "@/components/page-header";
import PrintButton from "@/app/[org]/components/print-button";
import { PrintExpander } from "@/components/results/print-expander";
import { TestResultSection } from "@/components/results/test-result-section";
import { Button } from "@/components/ui/button";
import { ensureMember } from "@/utils/authentication";
import { buildTestResult } from "@/utils/results";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

type PathParams = {
  params: {
    testId: string;
    submissionId: string;
  };
};

export default async function SubmissionPage({ params }: PathParams) {
  await ensureMember("viewIndividualResults");
  const base = organizationBase();
  const results = await getTranslations("results");
  const profile = await getTranslations("profile");
  const [test, submission] = await Promise.all([
    findTestById(params.testId),
    findTestSubmissionById(params.submissionId),
  ]);

  if (!test || !submission || submission.testId !== test.id) {
    notFound();
  }

  const user = await findUserById(submission.userId);

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <PrintExpander />
      <PageHeader
        className="mb-2"
        title={test.name}
        crumb={user ? formatFullName(user) : undefined}
        description={user ? formatFullName(user) : undefined}
        back={{ href: `${base}/tests/${test.id}/results`, label: results("title") }}
        actions={
          <>
            {user && (
              <Button variant="outline" asChild>
                <Link href={`${base}/reports/${user.id}`}>{profile("openReport")}</Link>
              </Button>
            )}
            <PrintButton />
          </>
        }
      />
      <TestResultSection result={buildTestResult(test, submission)} />
    </div>
  );
}
