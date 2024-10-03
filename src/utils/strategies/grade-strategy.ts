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
        let formula: string = scale.scale.resultCalculationFormula;
        let matches: string[] = formula.match(/\$\d+/g)!;

        for (const match of matches!) {
          const scaleNumber = Number(match.slice(1, match.length));

          formula = formula.replace(
            match,
            String(scales.find((s) => s.scale.id === scaleNumber)!.grade)
          );
        }

        return {
          scale: scale.scale,
          grade: Number(eval(formula)),
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
