import { findAllTestSubmissionsByUserId } from "@/actions/test-submission/find-all-test-submissions-by-user-id-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAvatar from "@/components/ui/user-avatar";
import { TestQuestion, TestQuestionResponse } from "@/utils/constants";
import { localizeResult } from "@/utils/content-translation";
import { getSubmissionSummary, toScaleRows } from "@/utils/scoring";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import PrintButton from "../../components/print-button";
import AdditionalNotes from "./additional-notes";
import AnswerTable from "./answer-table";
import SaveToArchiveButton from "./save-to-archive-button";
import ScaleTable from "./scale-table";
import Verdict from "./verdict";

interface PathParams {
  params: {
    userId: string;
  };
}

export default async function UserSummaryPage({ params }: PathParams) {
  const t = await getTranslations("reports");
  const format = await getFormatter();
  const locale = await getLocale();
  const { membership } = await ensureMember("viewDashboard");
  const write = can(membership.role, "writeConclusions");
  const [user, submissions, tests] = await Promise.all([
    findUserById(params.userId),
    findAllTestSubmissionsByUserId(params.userId),
    findAllTests(),
  ]);

  if (!user) {
    notFound();
  }

  const testsById = new Map(tests.map((test) => [test.id, test]));
  const results = submissions.flatMap((submission) => {
    const test = testsById.get(submission.testId);

    if (!test) {
      return [];
    }

    return [
      {
        id: submission.id,
        testName: test.name,
        date: format.dateTime(submission.createdAt, { dateStyle: "medium", timeStyle: "short" }),
        questions: JSON.parse(test.questions) as TestQuestion[],
        responses: JSON.parse(submission.submission) as TestQuestionResponse[],
        rows: toScaleRows(localizeResult(getSubmissionSummary(test, submission), test, locale)),
      },
    ];
  });

  const resultCard = (result: (typeof results)[number], children: React.ReactNode) => (
    <Card key={result.id} className="break-inside-avoid print:border-none print:shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">{result.testName}</CardTitle>
        <CardDescription>{result.date}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader
        title={t("reportTitle")}
        back={{ href: "/dashboard/summary", label: t("title") }}
        actions={
          <>
            {write && <SaveToArchiveButton userId={user.id} />}
            <PrintButton />
          </>
        }
      />
      <Card className="mb-6 print:border-none print:shadow-none">
        <CardHeader className="flex flex-row items-center gap-4">
          <UserAvatar user={user} className="h-16 w-16" />
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">{formatFullName(user)}</CardTitle>
            <CardDescription>{formatWorkInfo(user)}</CardDescription>
          </div>
        </CardHeader>
      </Card>
      <Tabs defaultValue="report">
        <TabsList className="mb-2 grid w-full grid-cols-3 print:hidden sm:w-fit">
          <TabsTrigger value="report">{t("tabs.report")}</TabsTrigger>
          <TabsTrigger value="answers">{t("tabs.answers")}</TabsTrigger>
          <TabsTrigger value="scales">{t("tabs.scales")}</TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="flex flex-col gap-4">
          <Card className="print:border-none print:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">{t("background")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AdditionalNotes />
            </CardContent>
          </Card>
          {results.length === 0 && (
            <p className="text-muted-foreground">{t("noResults")}</p>
          )}
          {results.map((result) =>
            resultCard(
              result,
              <dl className="flex flex-col gap-3">
                {result.rows.map((row) => (
                  <div key={row.scaleId} className="border-l-2 border-primary/40 pl-3">
                    <dt className="font-medium">{row.scaleName}</dt>
                    <dd className="text-sm text-muted-foreground">{row.summary}</dd>
                  </div>
                ))}
              </dl>
            )
          )}
          <Card className="print:border-none print:shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">{t("conclusion")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Verdict />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="answers" className="flex flex-col gap-4">
          {results.map((result) =>
            resultCard(result, <AnswerTable questions={result.questions} responses={result.responses} />)
          )}
        </TabsContent>

        <TabsContent value="scales" className="flex flex-col gap-4">
          {results.map((result) => resultCard(result, <ScaleTable rows={result.rows} />))}
        </TabsContent>
      </Tabs>
    </>
  );
}
