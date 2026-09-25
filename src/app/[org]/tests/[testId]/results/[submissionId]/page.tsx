import { findTestSubmissionById } from "@/actions/test-submission/find-test-submission-by-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { PageHeader } from "@/components/page-header";
import PrintButton from "@/app/[org]/components/print-button";
import { ScaleResultCard } from "@/components/scale-result-card";
import { ValidityPanel } from "@/components/validity-panel";
import type { TestScale } from "@/utils/constants";
import { scoreSubmission, toScaleRows } from "@/utils/scoring";
import { assessValidity, validityScaleIds } from "@/utils/validity";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

type PathParams = {
  params: {
    testId: string;
    submissionId: string;
  };
};

export default async function SubmissionPage({ params }: PathParams) {
  const base = organizationBase();
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
  const responses = JSON.parse(submission.submission);
  const score = scoreSubmission(test, responses);
  const rows = score ? toScaleRows(score.result) : [];
  const scales = JSON.parse(test.scales) as TestScale[];
  const validity = assessValidity(scales, responses, rows);
  const validityIds = validityScaleIds(scales);
  // Validity scales lead the page; the rest follow as findings.
  const ordered = [...rows.filter((row) => validityIds.has(row.scaleId)), ...rows.filter((row) => !validityIds.has(row.scaleId))];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        className="mb-2"
        title={test.name}
        description={user ? formatFullName(user) : undefined}
        back={{ href: `${base}/tests/${test.id}/results`, label: results("title") }}
        actions={<PrintButton />}
      />
      {validity && <ValidityPanel validity={validity} />}
      {rows.length === 0 && <p className="text-muted-foreground">{t("none")}</p>}
      {ordered.map((row) => (
        <ScaleResultCard key={row.scaleId} row={row} />
      ))}
    </div>
  );
}
