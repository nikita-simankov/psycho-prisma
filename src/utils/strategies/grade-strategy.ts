import Formula from "fparser";
import { SummaryTableRow, TestQuestionResponse, TestScale } from "../constants";

export class GradeStrategy {
  public static calculateGradesForScales = (
    scales: TestScale[],
    responses: TestQuestionResponse[]
  ) => {
    return scales.map((scale) => {
      let grade: number = 0;

      for (const key of scale.keys) {
        for (const response of responses) {
          if (
            response.questionId === key.questionId &&
            response.choiceId === key.choiceId
          ) {
            grade += key.grade;
          }
        }
      }

      return {
        scale: scale,
        grade: grade,
      };
    });
  };

  public static runCalculationFormula = (
    scales: ReturnType<typeof GradeStrategy.calculateGradesForScales>
  ) => {
    return scales.map((scale) => {
      if (
        scale.scale.resultCalculationFormula !== undefined &&
        scale.scale.resultCalculationFormula !== "Нет"
      ) {
        // Replace $N with the raw grade of scale N, then evaluate safely.
        const formula = scale.scale.resultCalculationFormula.replace(
          /\$(\d+)/g,
          (_, scaleNumber: string) => {
            const referenced = scales.find(
              (s) => s.scale.id === Number(scaleNumber)
            );

            if (!referenced) {
              throw new Error(
                `Formula for scale ${scale.scale.id} references missing scale ${scaleNumber}`
              );
            }

            return `(${referenced.grade})`;
          }
        );

        return {
          scale: scale.scale,
          grade: Number(new Formula(formula).evaluate({})),
        };
      } else {
        return {
          scale: scale.scale,
          grade: scale.grade,
        };
      }
    });
  };

  public static getSummary = (
    scales: ReturnType<typeof GradeStrategy.runCalculationFormula>,
    summaryTable: SummaryTableRow[]
  ) => {
    return scales.map((entry) => {
      for (const row of summaryTable) {
        if (entry?.scale.id === row.scaleId) {
          if (row.minGrade <= entry!.grade && entry!.grade <= row.maxGrade) {
            return {
              ...entry,
              summary: row.summaryText,
            };
          }
        } else {
          continue;
        }
      }
    });
  };
}
