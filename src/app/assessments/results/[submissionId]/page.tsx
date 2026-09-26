import { ScaleProfile } from "@/components/results/scale-profile";
import { ensureMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { feedbackTestIds } from "@/utils/feedback";
import { buildTestResult } from "@/utils/results";
import { testAsAnswered } from "@/utils/instrument-versions";
import { ChevronLeft, Info } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  const t = await getTranslations("feedback");
  return { title: t("title") };
}

// A person's own results, when their organization shares them for this test. Validity and
// answer-quality checks stay with the specialists.
export default async function FeedbackPage({ params }: { params: { submissionId: string } }) {
  const { user, organization } = await ensureMember();
  const t = await getTranslations("feedback");
  const respondent = await getTranslations("respondent");
  const format = await getFormatter();
  const submission = await prisma.testSubmission.findFirst({
    where: { id: params.submissionId, userId: user.id, organizationId: organization.id },
  });

  if (!submission || !(await feedbackTestIds(organization.id)).has(submission.testId)) {
    notFound();
  }

  const test = await prisma.test.findUnique({ where: { id: submission.testId } });
  if (!test) {
    notFound();
  }

  const result = buildTestResult(localizeTest(await testAsAnswered(test, submission), await getLocale()), submission);
  const findings = [...result.keyFindings, ...result.otherFindings].filter((row) => row.summary);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:py-10">
      <Link href="/assessments" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        {respondent("home")}
      </Link>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{t("title")}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{result.testName}</h1>
        <p className="text-sm text-muted-foreground">{format.dateTime(result.createdAt, { dateStyle: "long" })}</p>
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("note")}
      </p>
      {result.rows.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-lg font-semibold">
            {t("profile")}
          </h2>
          <ScaleProfile rows={result.rows} />
        </section>
      )}
      {findings.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="reading-heading">
          <h2 id="reading-heading" className="text-lg font-semibold">
            {t("reading")}
          </h2>
          <dl className="flex flex-col gap-3">
            {findings.map((row) => (
              <div key={row.scaleId} className="rounded-lg border bg-card p-4">
                <dt className="font-medium">{row.scaleName}</dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{row.summary}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
