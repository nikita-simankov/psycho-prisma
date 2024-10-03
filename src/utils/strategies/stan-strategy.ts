import { StanTableRow, SummaryTableRow } from "../constants";
import { GradeStrategy } from "./grade-strategy";

export class StanStrategy {
  public static getStanFromGrades(
    scales: ReturnType<typeof GradeStrategy.calculateGradesForScales>,
    stanTable: StanTableRow[]
  ) {
    return scales.map((entry) => {
      for (const row of stanTable) {
        if (entry.scale.id === row.scaleId) {
          if (row.minGrade <= entry.grade && entry.grade <= row.maxGrade) {
            return {
              ...entry,
              stanValue: row.stanValue,
            };
          }
        } else {
          continue;
        }
      }
    });
  }

  public static getSummary(
    scales: ReturnType<typeof StanStrategy.getStanFromGrades>,
    summaryTable: SummaryTableRow[]
  ) {
    return scales.map((entry) => {
      for (const row of summaryTable) {
        if (entry?.scale.id === row.scaleId) {
          if (
            row.minStanValue <= entry!.stanValue &&
            entry!.stanValue <= row.maxStanValue
          ) {
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
  }
}
