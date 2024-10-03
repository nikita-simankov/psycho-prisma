import { findTestSubmissionById } from "@/actions/test-submission/find-test-submission-by-id-action";
import { uploadTestSubmissionSummary } from "@/actions/test-submission/upload-test-submission-summary-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StanTableRow,
  SummaryTableRow,
  TestQuestionResponse,
  TestScale,
  TGradeTableRow,
} from "@/utils/constants";
import { GradeStrategy } from "@/utils/strategies/grade-strategy";
import { StanStrategy } from "@/utils/strategies/stan-strategy";
import { TGradeStrategy } from "@/utils/strategies/t-grade-strategy";

type PathParams = {
  params: {
    testId: string;
    submissionId: string;
  };
};

export default async function SubmissionPage({ params }: PathParams) {
  const test = await findTestById(params.testId);
  const submission = await findTestSubmissionById(params.submissionId);

  const parsedScales = JSON.parse(test?.scales!) as TestScale[];
  const parsedSubmission = JSON.parse(
    submission?.submission!
  ) as TestQuestionResponse[];

  const stanTable = JSON.parse(test?.stanTable!) as StanTableRow[];
  const tGradeTable = JSON.parse(test?.tGradeTable!) as TGradeTableRow[];
  const summaryTable = JSON.parse(test?.summaryTable!) as SummaryTableRow[];

  const scaleGrades = GradeStrategy.runCalculationFormula(
    GradeStrategy.calculateGradesForScales(parsedScales, parsedSubmission)
  );

  if (test?.strategy === "t-grade") {
    const correctionScaleGrade: number = TGradeStrategy.getCorrectionScaleGrade(
      scaleGrades,
      "Шкала коррекции (К)"
    );

    const correctedScaleGrade = TGradeStrategy.applyGradeCorrection(
      scaleGrades,
      [4, 7, 9, 10, 11],
      correctionScaleGrade
    );

    const scaleTGrades = TGradeStrategy.convertRawGradeToTGrade(
      correctedScaleGrade,
      tGradeTable
    );

    const result = TGradeStrategy.getSummary(scaleTGrades, summaryTable);

    await uploadTestSubmissionSummary(submission?.id!, JSON.stringify(result));

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

  if (test?.strategy === "standard-ten") {
    const scaleStans = StanStrategy.getStanFromGrades(scaleGrades, stanTable);

    const stansSummary = StanStrategy.getSummary(
      scaleStans.filter((item) => item !== undefined),
      summaryTable
    );

    await uploadTestSubmissionSummary(
      submission?.id!,
      JSON.stringify(stansSummary)
    );

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

  if (test?.strategy === "grade") {
    const gradeSummary = GradeStrategy.getSummary(scaleGrades, summaryTable);

    const filteredGradeSummary = gradeSummary.filter(
      (g) => g !== undefined || g !== null
    );

    await uploadTestSubmissionSummary(
      submission?.id!,
      JSON.stringify(filteredGradeSummary)
    );

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
}
