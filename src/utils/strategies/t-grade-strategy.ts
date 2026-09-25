import { SummaryTableRow, TGradeTableRow } from "../constants";
import { GradeStrategy } from "./grade-strategy";

export class TGradeStrategy {
  public static getCorrectionScaleGrade = (
    entries: ReturnType<typeof GradeStrategy.calculateGradesForScales>,
    scaleId: number
  ): number => {
    return entries.find((entry) => entry.scale.id === scaleId)?.grade ?? 0;
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
      const rows = tGradeTable.filter((row) => row.scaleId === entry.scale.id);

      if (rows.length === 0) {
        return undefined;
      }

      // Raw scores beyond the ends of the table take the nearest row, so an extreme
      // score still gets the extreme T-score instead of disappearing.
      const row =
        rows.find((item) => item.rawGrade === entry.correctedGrade) ??
        rows.reduce((nearest, item) =>
          Math.abs(item.rawGrade - entry.correctedGrade) < Math.abs(nearest.rawGrade - entry.correctedGrade)
            ? item
            : nearest
        );

      return {
        ...entry,
        tGradeValue: row.convertedGrade,
      };
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
