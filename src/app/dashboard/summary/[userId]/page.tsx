import { findAllTestSubmissionsByUserId } from "@/actions/test-submission/find-all-test-submissions-by-user-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradeStrategy } from "@/utils/strategies/grade-strategy";
import { StanStrategy } from "@/utils/strategies/stan-strategy";
import { TGradeStrategy } from "@/utils/strategies/t-grade-strategy";
import PrintButton from "../../components/print-button";
import AdditionalNotes from "./additional-notes";
import AnswerTable from "./answer-table";
import SaveToArchiveButton from "./save-to-archive-button";
import Verdict from "./verdict";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserAvatar from "@/components/ui/user-avatar";

interface PathParams {
  params: {
    userId: string;
  };
}

export default async function UserSummaryPage({ params }: PathParams) {
  const user = await findUserById(params.userId);
  const userSubmissions = await findAllTestSubmissionsByUserId(params.userId);
  const summaryForEachTest = userSubmissions.map(async (submission) => {
    const test = await findTestById(submission.testId);

    switch (test?.strategy) {
      case "grade":
        const gradeTestSummary = (
          JSON.parse(submission.summary) as ReturnType<
            typeof GradeStrategy.getSummary
          >
        ).filter((summary) => summary !== null && summary !== undefined);

        return {
          name: test.name,
          strategy: test.strategy,
          questions: test.questions,
          testScales: gradeTestSummary.map(async (parsedScale) => ({
            scaleId: parsedScale?.scale.id,
            scaleName: parsedScale?.scale.name,

            scaleStanValue: null,
            scaleTGradeValue: null,
            scaleRawGradeValue: parsedScale?.grade,
            scaleGeneratedSummary: parsedScale?.summary,
            scaleCorrectedGradeValue: null,
          })),
          testSubmission: submission,
        };
      case "t-grade":
        const tGradeTestSummary = (
          JSON.parse(submission.summary) as ReturnType<
            typeof TGradeStrategy.getSummary
          >
        ).filter((summary) => summary !== null && summary !== undefined);

        return {
          name: test.name,
          strategy: test.strategy,
          questions: test.questions,
          testScales: tGradeTestSummary.map(async (parsedScale) => ({
            scaleId: parsedScale?.scale.id,
            scaleName: parsedScale?.scale.name,
            scaleStanValue: null,
            scaleTGradeValue: parsedScale.tGradeValue,
            scaleRawGradeValue: parsedScale?.grade,
            scaleGeneratedSummary: parsedScale?.summary,
            scaleCorrectedGradeValue: parsedScale?.correctedGrade,
          })),
          testSubmission: submission,
        };
      case "standard-ten":
        const stanTestSummary = (
          JSON.parse(submission.summary) as ReturnType<
            typeof StanStrategy.getSummary
          >
        ).filter((summary) => summary !== null && summary !== undefined);

        return {
          id: test.id,
          name: test.name,
          strategy: test.strategy,
          questions: test.questions,
          testScales: stanTestSummary.map(async (parsedScale) => ({
            scaleId: parsedScale?.scale.id,
            scaleName: parsedScale?.scale.name,

            scaleStanValue: parsedScale?.stanValue,
            scaleTGradeValue: null,
            scaleRawGradeValue: parsedScale?.grade,
            scaleGeneratedSummary: parsedScale?.summary,
            scaleCorrectedGradeValue: null,
          })),
          testSubmission: submission,
        };
    }
  });

  return (
    <div className="p-10 max-w-7xl w-full mx-auto">
      <Tabs defaultValue="1">
        <TabsList className="w-full print:hidden">
          <TabsTrigger value="1" className="w-1/3">
            Характеристика
          </TabsTrigger>
          <TabsTrigger value="2" className="w-1/3">
            Ответы по тестам
          </TabsTrigger>
          <TabsTrigger value="3" className="w-1/3">
            Баллы по шкалам
          </TabsTrigger>
        </TabsList>
        <TabsContent value="1" className="flex flex-col gap-4">
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-4">
                <UserAvatar user={user!} className="w-20 h-20" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    Социально-психологическая характеристика на военнослужащего
                  </span>
                  <CardTitle>
                    {user?.lastName} {user?.name} {user?.surname}
                  </CardTitle>
                  <CardDescription>
                    {user?.rank}, {user?.division}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <SaveToArchiveButton userId={params.userId} />
                <PrintButton />
              </div>
            </CardHeader>
          </Card>
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-lg">
                Биографические данные военнослужащего
              </CardTitle>
              <CardContent className="p-0 pb-2">
                <AdditionalNotes />
              </CardContent>
            </CardHeader>
          </Card>
          {summaryForEachTest.map(async (summary) => {
            return (
              <Card>
                <CardHeader>
                  <CardTitle>{(await summary)?.name}</CardTitle>
                  <span className="text-lg text-muted-foreground">
                    {(await summary)?.testSubmission.createdAt.toLocaleString()}
                  </span>
                </CardHeader>
                <CardContent>
                  {(await summary)?.testScales.map(async (scale) => {
                    return (
                      <div className="flex flex-col">
                        <span className="text-md font-bold">
                          {(await scale).scaleName}
                        </span>
                        <p className="text-sm font-medium text-muted-foreground">
                          {(await scale).scaleGeneratedSummary}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="px-4 py-2">
              <CardTitle className="text-lg">Заключение</CardTitle>
              <CardContent className="p-0 pb-2">
                <Verdict />
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="2" className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Социально-психологическая характеристика на военнослужащего{" "}
                  <span className="text-black font-bold">
                    {user?.rank.toLowerCase()} {user?.lastName} {user?.name}{" "}
                    {user?.surname}
                  </span>
                </span>
                <CardTitle>Ответы по тестам</CardTitle>
              </div>
              <PrintButton />
            </CardHeader>
          </Card>
          {summaryForEachTest
            .filter((s) => s !== null && s !== undefined)
            .map(async (testSummary) => {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>{(await testSummary)?.name}</CardTitle>
                    <span className="text-lg text-muted-foreground">
                      {(
                        await testSummary
                      )?.testSubmission.createdAt.toLocaleString()}
                    </span>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <AnswerTable
                      questions={(await testSummary)?.questions!}
                      testSubmission={(await testSummary)?.testSubmission!}
                    />
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
        <TabsContent value="3" className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Социально-психологическая характеристика на военнослужащего{" "}
                  <span className="text-black font-bold">
                    {user?.rank.toLowerCase()} {user?.lastName} {user?.name}{" "}
                    {user?.surname}
                  </span>
                </span>
                <CardTitle>Баллы по шкалам</CardTitle>
              </div>
              <PrintButton />
            </CardHeader>
          </Card>
          {summaryForEachTest
            .filter((s) => s !== null && s !== undefined)
            .map(async (testSummary) => {
              return (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>{(await testSummary)?.name}</CardTitle>
                    <span className="text-lg text-muted-foreground">
                      {(
                        await testSummary
                      )?.testSubmission.createdAt.toLocaleString()}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <table className="border w-full">
                      <tr className="text-center">
                        <th className="border">№ п/п</th>
                        <th className="border">Шкала</th>
                        <th className="border">Сырой балл</th>
                        {(await testSummary)!.strategy === "standard-ten" && (
                          <th>Значение СТЭН</th>
                        )}
                        {(await testSummary)!.strategy === "t-grade" && (
                          <>
                            <th>Т-Балл</th>
                            <th>Корретированный балл</th>
                          </>
                        )}
                      </tr>
                      {(await testSummary)!.testScales.map(async (result) => (
                        <tr className="text-center">
                          <td className="border">{(await result).scaleId}</td>
                          <td className="border">{(await result).scaleName}</td>
                          <td className="border">
                            {(await result).scaleRawGradeValue}
                          </td>
                          {(await testSummary)!.strategy === "standard-ten" && (
                            <td className="border">
                              {(await result).scaleStanValue}
                            </td>
                          )}
                          {(await testSummary)!.strategy === "t-grade" && (
                            <>
                              <td className="border">
                                {(await result).scaleTGradeValue}
                              </td>
                              <td className="border">
                                {(await result).scaleCorrectedGradeValue}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </table>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
