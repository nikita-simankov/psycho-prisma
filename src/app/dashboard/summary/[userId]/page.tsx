import { findAllTestSubmissionsByUserId } from "@/actions/test-submission/find-all-test-submissions-by-user-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GradeStrategy } from "@/utils/strategies/grade-strategy";
import { StanStrategy } from "@/utils/strategies/stan-strategy";
import { TGradeStrategy } from "@/utils/strategies/t-grade-strategy";
import { Printer } from "lucide-react";
import PrintButton from "../../components/print-button";

type PathParams = {
  params: {
    userId: string;
  };
};

export default async function UserSummaryPage({ params }: PathParams) {
  const user = await findUserById(params.userId);
  const submissions = await findAllTestSubmissionsByUserId(params.userId);

  const summaryForTests = submissions.map(async (submission) => {
    const test = await findTestById(submission.testId);
    if (test?.strategy === "standard-ten") {
      const scales = JSON.parse(submission.summary) as ReturnType<
        typeof StanStrategy.getSummary
      >;

      const newScales = scales.filter((s) => s !== undefined || s !== null);

      return {
        testName: test?.name,
        submissionDate: submission.createdAt.toLocaleString(),
        scales: newScales.map((entry) => {
          return {
            scaleName: entry!.scale.name,
            scaleSummary: entry!.summary,
          };
        }),
      };
    }

    if (test?.strategy === "t-grade") {
      const scales = JSON.parse(submission.summary) as ReturnType<
        typeof TGradeStrategy.getSummary
      >;

      const newScales = scales.filter((s) => s !== undefined || s !== null);

      return {
        testName: test?.name,
        submissionDate: submission.createdAt.toLocaleString(),
        scales: newScales.map((entry) => {
          return {
            scaleName: entry!.scale.name,
            scaleSummary: entry!.summary,
          };
        }),
      };
    }

    if (test?.strategy === "grade") {
      const scales = JSON.parse(submission.summary) as ReturnType<
        typeof GradeStrategy.getSummary
      >;

      const newScales = scales.filter((s) => s !== null);

      return {
        testName: test?.name,
        submissionDate: submission.createdAt.toLocaleString(),
        scales: newScales.map((entry) => {
          return {
            scaleName: entry!.scale.name,
            scaleSummary: entry!.summary,
          };
        }),
      };
    }
  });

  return (
    <div className="flex flex-col">
      <Card className="print:border-none print:outline-none print:shadow-none">
        <CardHeader>
          <div className="flex flex-row items-start justify-between">
            <span className="text-md">
              Социально-психологическая характеристика на пользователя <br />
              <span className="text-2xl">
                {user?.lastName} {user?.name} {user?.surname}
              </span>{" "}
              ({user?.rank}, {user?.division})
            </span>
            <PrintButton />
          </div>
          <Textarea
            placeholder="Заметки о военнослужащем"
            className="print:border-none print:outline-none print:shadow-none"
          />
        </CardHeader>
      </Card>
      <Card className="print:border-none print:outline-none print:shadow-none">
        {summaryForTests.map(async (summaryForTest) => (
          <CardContent className="p-1 flex flex-col">
            <CardTitle className="text-md m-0 p-0">
              <div className="flex flex-row items-center justify-between">
                <h1>{(await summaryForTest)?.testName}</h1>
                <span>{(await summaryForTest)?.submissionDate}</span>
              </div>
            </CardTitle>
            {(await summaryForTest)?.scales.map((scale) => {
              return (
                <div>
                  <h1 className="text-md font-bold">{scale.scaleName}</h1>
                  <p className="text-sm">{scale.scaleSummary}</p>
                </div>
              );
            })}
          </CardContent>
        ))}
      </Card>
      <Textarea
        placeholder="Звание, должность, фамилия и инициалы"
        className="resize-none print:border-none print:outline-none print:shadow-none"
      />
    </div>
  );
}
