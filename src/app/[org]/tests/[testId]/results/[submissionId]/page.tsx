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
import { testAsAnswered } from "@/utils/instrument-versions";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { auditAs } from "@/utils/audit";
import { formatFullName } from "@/utils/user";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

type PathParams = {
  params: Promise<{
    testId: string;
    submissionId: string;
  }>;
};

export default async function SubmissionPage(props: PathParams) {
  const params = await props.params;
  const context = await ensureMember("viewIndividualResults");
  const base = await organizationBase();
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
  const rawTest = await prisma.test.findUniqueOrThrow({ where: { id: test.id } });
  await auditAs(context, "viewTestResult", { subjectId: submission.userId, detail: { testId: test.id, submissionId: submission.id } });

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
      <TestResultSection result={buildTestResult(localizeTest(await testAsAnswered(rawTest, submission), await getLocale()), submission)} />
    </div>
  );
}
