import { findTestSubmissionById } from "@/actions/test-submission/find-test-submission-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import PrintButton from "@/app/[org]/components/print-button";
import { TargetPicker } from "@/components/hiring/target-picker";
import { PageHeader } from "@/components/page-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { auditAs } from "@/utils/audit";
import { ensureMember } from "@/utils/authentication";
import { localizeTest } from "@/utils/content-translation";
import { prisma } from "@/utils/database";
import { chooseTarget, loadTargetProfiles } from "@/utils/hiring";
import { testAsAnswered } from "@/utils/instrument-versions";
import { interviewTopics } from "@/utils/interview-guide";
import { libraryWhere } from "@/utils/library";
import { organizationBase } from "@/utils/organization-path";
import { buildTestResult } from "@/utils/results";
import { bandsByScale, targetKind } from "@/utils/target-profiles";
import { formatFullName } from "@/utils/user";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PathParams = {
  params: Promise<{ testId: string; submissionId: string }>;
  searchParams: Promise<{ target?: string }>;
};

// Follow-up interview questions for one candidate's result, laid out to print and write on.
export default async function InterviewGuidePage(props: PathParams) {
  const params = await props.params;
  const context = await ensureMember("viewIndividualResults");
  const base = await organizationBase();
  const t = await getTranslations("hiring.interview");
  const chart = await getTranslations("profileChart");
  const submission = await findTestSubmissionById(params.submissionId);
  const test = submission
    ? await prisma.test.findFirst({ where: { id: params.testId, sensitive: false, AND: [libraryWhere(context.organization.id)] } })
    : null;

  if (!submission || !test || submission.testId !== test.id || !targetKind(test.strategy)) {
    notFound();
  }

  const user = await findUserById(submission.userId);
  const result = buildTestResult(localizeTest(await testAsAnswered(test, submission), await getLocale()), submission);
  const profiles = await loadTargetProfiles(context.organization.id, test.id);
  const target = chooseTarget(profiles, (await props.searchParams).target);
  const bands = bandsByScale(target?.bands);
  const topics = interviewTopics(result.rows, target?.bands);
  await auditAs(context, "viewTestResult", { subjectId: submission.userId, detail: { testId: test.id, submissionId: submission.id } });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        className="mb-0"
        title={t("title")}
        crumb={t("title")}
        eyebrow={result.testName}
        description={user ? formatFullName(user) : undefined}
        back={{ href: `${base}/tests/${test.id}/results/${submission.id}`, label: result.testName }}
        actions={<PrintButton />}
      />
      <div className="flex flex-col gap-3 print:hidden">
        <TargetPicker profiles={profiles} current={target?.id ?? null} />
      </div>
      <p className="max-w-[68ch] text-sm text-muted-foreground">
        {t("intro")} {target ? t("withProfile", { profile: target.name }) : t("withoutProfile")}
      </p>

      {topics.length === 0 ? (
        <p className="border-t border-foreground/80 pt-5 leading-relaxed">{t("none")}</p>
      ) : (
        <ol className="flex flex-col gap-8">
          {topics.map((topic, index) => {
            const band = bands.get(topic.scaleId);
            const questions = topic.questions.length
              ? topic.questions
              : [t(`generic.${topic.direction}1`, { scale: topic.scaleName }), t(`generic.${topic.direction}2`, { scale: topic.scaleName })];
            return (
              <li key={topic.scaleId} data-topic className="flex break-inside-avoid flex-col gap-3 border-t border-foreground/80 pt-4 print:border-gray-800">
                <header className="flex flex-col gap-1">
                  <Eyebrow>
                    {index + 1} · {t(`reason.${topic.reason}`, { from: band?.min ?? 0, to: band?.max ?? 0 })} · {chart(`kind.${topic.kind}`)} {topic.value}
                  </Eyebrow>
                  <h2 className="text-xl font-medium">{topic.scaleName}</h2>
                  {result.info[topic.scaleId]?.description && (
                    <p className="max-w-[68ch] text-sm text-muted-foreground">{result.info[topic.scaleId]?.description}</p>
                  )}
                </header>
                <ul className="flex list-disc flex-col gap-2 pl-5">
                  {questions.map((question) => (
                    <li key={question} className="leading-relaxed">
                      {question}
                    </li>
                  ))}
                </ul>
                <div aria-hidden className="hidden h-24 border-b border-dashed print:block" />
              </li>
            );
          })}
        </ol>
      )}
      <p className="border-t pt-3 text-xs text-muted-foreground">{t("caution")}</p>
    </div>
  );
}
