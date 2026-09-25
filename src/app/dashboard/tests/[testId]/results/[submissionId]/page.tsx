import { findTestSubmissionById } from "@/actions/test-submission/find-test-submission-by-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { PageHeader } from "@/components/page-header";
import PrintButton from "@/app/dashboard/components/print-button";
import { ScaleResultCard } from "@/components/scale-result-card";
import { scoreSubmission, toScaleRows } from "@/utils/scoring";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    testId: string;
    submissionId: string;
  };
};

export default async function SubmissionPage({ params }: PathParams) {
  const t = await getTranslations("scores");
  const results = await getTranslations("results");
  const [test, submission] = await Promise.all([
    findTestById(params.testId),
    findTestSubmissionById(params.submissionId),
  ]);

  if (!test || !submission || submission.testId !== test.id) {
    notFound();
  }

  const user = await findUserById(submission.userId);
  // Recomputed from the answers so the page reflects the test's current tables.
  const score = scoreSubmission(test, JSON.parse(submission.submission));
  const rows = score ? toScaleRows(score.result) : [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        className="mb-2"
        title={test.name}
        description={user ? formatFullName(user) : undefined}
        back={{ href: `/dashboard/tests/${test.id}/results`, label: results("title") }}
        actions={<PrintButton />}
      />
      {rows.length === 0 && <p className="text-muted-foreground">{t("none")}</p>}
      {rows.map((row) => (
        <ScaleResultCard key={row.scaleId} row={row} />
      ))}
    </div>
  );
}
