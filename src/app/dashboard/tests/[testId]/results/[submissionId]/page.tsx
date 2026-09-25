import { findTestSubmissionById } from "@/actions/test-submission/find-test-submission-by-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
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
    <div className="p-12 flex flex-col gap-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{test.name}</h1>
          {user && <p className="text-muted-foreground">{formatFullName(user)}</p>}
        </div>
        <PrintButton />
      </div>
      {rows.length === 0 && <p className="text-muted-foreground">{t("none")}</p>}
      {rows.map((row) => (
        <ScaleResultCard key={row.scaleId} row={row} />
      ))}
    </div>
  );
}
