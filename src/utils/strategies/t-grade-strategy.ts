import { SummaryTableRow, TGradeTableRow } from "../constants";
import { GradeStrategy } from "./grade-strategy";

export class TGradeStrategy {
  public static getCorrectionScaleGrade = (
    entries: ReturnType<typeof GradeStrategy.calculateGradesForScales>,
    name: string
  ): number => {
    return entries.filter((entry) => entry.scale.name === name)[0].grade;
  };

  public static applyGradeCorrection = (
    data: ReturnType<typeof GradeStrategy.calculateGradesForScales>,
    scalesToCorrect: Array<number>,
    correctionScaleGrade: number
  ) => {
    return data.map((entry) => {
      const correctedGrade = Math.round(
        entry.grade + entry.scale.correction * correctionScaleGrade
      );

      return {
        scale: entry.scale,
        grade: entry.grade,
        correctedGrade: scalesToCorrect.includes(entry.scale.id)
          ? correctedGrade
          : entry.grade,
      };
    });
  };

  public static convertRawGradeToTGrade = (
    data: ReturnType<typeof TGradeStrategy.applyGradeCorrection>,
    tGradeTable: TGradeTableRow[]
  ) => {
    return data.map((entry) => {
      for (const row of tGradeTable) {
        if (
          entry.scale.id === row.scaleId &&
          row.rawGrade === entry.correctedGrade
        ) {
          return {
            ...entry,
            tGradeValue: row.convertedGrade,
          };
        }
      }
    });
  };

  public static getSummary = (
    data: ReturnType<typeof TGradeStrategy.convertRawGradeToTGrade>,
    summaryTable: SummaryTableRow[]
  ) => {
    return data
      .map((entry) => {
        for (const row of summaryTable) {
          if (
            row.scaleId === entry?.scale.id &&
            row.minTGrade <= entry.tGradeValue &&
            entry.tGradeValue <= row.maxTGrade
          ) {
            return {
              ...entry,
              summary: row.summaryText,
            };
          }
        }
      })
      .filter((item) => item !== undefined);
  };
}
