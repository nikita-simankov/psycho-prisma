import { findTestSubmissionById } from "@/actions/test-submission/find-test-submission-by-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { scoreSubmission } from "@/utils/scoring";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    testId: string;
    submissionId: string;
  };
};

export default async function SubmissionPage({ params }: PathParams) {
  const test = await findTestById(params.testId);
  const submission = await findTestSubmissionById(params.submissionId);

  if (!test || !submission || submission.testId !== test.id) {
    notFound();
  }

  const score = scoreSubmission(test, JSON.parse(submission.submission));

  if (score?.strategy === "t-grade") {
    const result = score.result;

    return (
      <div className="p-12 flex flex-col gap-6`">
        {result.map((entry) => (
          <Card>
            <CardHeader>
              <CardTitle>{entry.scale.name}</CardTitle>
              <CardDescription>
                <span>Количеcтво баллов: {entry!.grade}</span>
                <br />
                <span>Скорректированный балл: {entry!.correctedGrade}</span>
                <br />
                <span>Количество Т-Баллов: {entry.tGradeValue}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>{entry.summary}</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (score?.strategy === "standard-ten") {
    const stansSummary = score.result;

    return (
      <div className="p-12 flex flex-col gap-6">
        {stansSummary.map((entry) => (
          <Card>
            <CardHeader>
              <CardTitle>{entry!.scale!.name}</CardTitle>
              <CardDescription>
                <span>Сырой балл: {entry!.grade}</span>
                <br />
                <span>СТЭН: {entry?.stanValue}</span>
                <br />
              </CardDescription>
            </CardHeader>
            <CardContent>{entry?.summary}</CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (score?.strategy === "grade") {
    const gradeSummary = score.result;

    return (
      <div className="p-12 flex flex-col gap-6">
        {gradeSummary
          .filter((s) => s !== undefined)
          .map((entry) => (
            <Card>
              <CardHeader>
                <CardTitle>{entry!.scale.name}</CardTitle>
                <CardDescription>
                  Балл:{" "}
                  <span className="text-primary font-bold">
                    {" "}
                    {entry!.grade}
                  </span>
                  <br />
                  <span>
                    Характеристика:
                    <span className="text-black dark:text-white font-bold">
                      {" "}
                      {entry?.summary}
                    </span>
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
      </div>
    );
  }

  notFound();
}
