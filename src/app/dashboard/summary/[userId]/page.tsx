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
import { getSubmissionSummary, toScaleRows } from "@/utils/scoring";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
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
        rows: toScaleRows(getSubmissionSummary(test, submission)),
      },
    ];
  });

  const header = (title: string) => (
    <Card className="print:border-none print:shadow-none">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <UserAvatar user={user} className="w-20 h-20" />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{title}</span>
            <CardTitle>{formatFullName(user)}</CardTitle>
            <CardDescription>{formatWorkInfo(user)}</CardDescription>
          </div>
        </div>
        <div className="flex flex-col gap-2 print:hidden">
          <SaveToArchiveButton userId={user.id} />
          <PrintButton />
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="p-10 max-w-7xl w-full mx-auto">
      <Tabs defaultValue="report">
        <TabsList className="w-full print:hidden">
          <TabsTrigger value="report" className="w-1/3">
            {t("tabs.report")}
          </TabsTrigger>
          <TabsTrigger value="answers" className="w-1/3">
            {t("tabs.answers")}
          </TabsTrigger>
          <TabsTrigger value="scales" className="w-1/3">
            {t("tabs.scales")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="flex flex-col gap-4">
          {header(t("reportTitle"))}
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-lg">{t("background")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <AdditionalNotes />
            </CardContent>
          </Card>
          {results.length === 0 && (
            <p className="text-muted-foreground">{t("noResults")}</p>
          )}
          {results.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle>{result.testName}</CardTitle>
                <CardDescription>{result.date}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {result.rows.map((row) => (
                  <div key={row.scaleId} className="flex flex-col">
                    <span className="font-bold">{row.scaleName}</span>
                    <p className="text-sm font-medium text-muted-foreground">
                      {row.summary}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-lg">{t("conclusion")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              <Verdict />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="answers" className="flex flex-col gap-4">
          {header(t("tabs.answers"))}
          {results.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle>{result.testName}</CardTitle>
                <CardDescription>{result.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <AnswerTable questions={result.questions} responses={result.responses} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="scales" className="flex flex-col gap-4">
          {header(t("tabs.scales"))}
          {results.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <CardTitle>{result.testName}</CardTitle>
                <CardDescription>{result.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScaleTable rows={result.rows} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
