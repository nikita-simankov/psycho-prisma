import { Eyebrow } from "@/components/ui/eyebrow";
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
export default async function FeedbackPage(props: { params: Promise<{ submissionId: string }> }) {
  const params = await props.params;
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:py-14">
      <Link href="/assessments" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        {respondent("home")}
      </Link>
      <header className="flex flex-col gap-3">
        <Eyebrow>
          {t("title")} · {format.dateTime(result.createdAt, { dateStyle: "long" })}
        </Eyebrow>
        <h1 className="text-4xl font-medium leading-[1.1]">{result.testName}</h1>
      </header>
      <p className="flex items-start gap-2 border-l-2 border-primary bg-card py-3 pl-4 pr-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("note")}
      </p>
      {result.rows.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-foreground/80 pt-4" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-xl font-medium">
            {t("profile")}
          </h2>
          <ScaleProfile rows={result.rows} info={result.info} />
        </section>
      )}
      {findings.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-foreground/80 pt-4" aria-labelledby="reading-heading">
          <h2 id="reading-heading" className="text-xl font-medium">
            {t("reading")}
          </h2>
          <dl className="flex flex-col gap-3">
            {findings.map((row) => (
              <div key={row.scaleId} className="border-b pb-3 last:border-b-0">
                <dt className="font-medium">{row.scaleName}</dt>
                <dd className="mt-1 whitespace-pre-line leading-relaxed text-muted-foreground">{row.summary}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
