import {
  StanTableRow,
  SummaryTableRow,
  TestData,
  TestQuestion,
  TestQuestionChoice,
  TestScale,
  TestScaleKey,
  TGradeTableRow,
} from "../constants";
import { getSheetRows, readWorkbook, Workbook } from "./workbook";

export async function extractTestData(
  file: File,
  testData: TestData,
  setTestData: React.Dispatch<React.SetStateAction<TestData>>
) {
  const workBook = await readWorkbook(file);

  setTestData({
    ...testData,
    scales: extractScales(workBook),
    questions: extractQuestions(workBook),
    stanTable: extractStanTable(workBook),
    tGradeTable: extractTGradeTable(workBook),
    summaryTable: extractSummaryTable(workBook),
  });
}

function extractScales(workBook: Workbook) {
  const scales = getSheetRows(workBook, "Обработка");

  const parsedScales: TestScale[] = scales.map((entry: any) => {
    const [
      scaleId,
      scaleName,
      scaleKeysString,
      scaleGradeMultiplier,
      scaleCorrectionCoefficient,
      scaleResultCalculationFormula,
    ] = [
      entry["ID"],
      entry["Шкала"],
      entry["Список ключей"],
      entry["Множитель баллов"],
      entry["Коэффициент коррекции"],
      entry["Формула расчета результата"],
    ];

    return {
      id: scaleId as number,
      name: scaleName as string,
      keys:
        scaleKeysString !== undefined
          ? (scaleKeysString as string).split(", ").map((key) => {
              const data = key.split(":");

              if (data[2]) {
                return {
                  questionId: Number(data[0]),
                  choiceId: Number(data[1]),
                  grade: Number(data[2]),
                } as TestScaleKey;
              }

              return {
                questionId: Number(data[0]),
                choiceId: Number(data[1]),
                grade: 1,
              } as TestScaleKey;
            })
          : [],
      multiplier: scaleGradeMultiplier as number,
      correction: scaleCorrectionCoefficient as number,
      resultCalculationFormula: scaleResultCalculationFormula as string,
    };
  });

  return parsedScales;
}

function extractQuestions(workBook: Workbook): TestQuestion[] {
  const questions = getSheetRows(workBook, "Список вопросов");

  const parsedQuestions: TestQuestion[] = questions.map((entry: any) => {
    const [
      questionId,
      questionText,
      questionChoiceType,
      questionChoicesString,
    ] = [
      entry["ID"],
      entry["Вопрос"],
      entry["Тип ответа"],
      entry["Варианты ответа"],
    ];

    return {
      id: Number(questionId),
      text: questionText as string,
      type: questionChoiceType,
      choices: (questionChoicesString as string)
        .split("; ")
        .map((choice, index) => {
          return {
            id: index + 1,
            text: choice,
          } as TestQuestionChoice;
        }),
    };
  });

  return parsedQuestions;
}

function extractStanTable(workBook: Workbook): StanTableRow[] {
  const tableData = getSheetRows(workBook, "Таблица перевода в СТЭН");

  const parsedRows: StanTableRow[] = tableData.map((entry: any) => {
    const [scaleId, minGrade, maxGrade, convertedGrade] = [
      entry["ID Шкалы"],
      entry["Минимальный балл"],
      entry["Максимальный балл"],
      entry["Значение СТЭН"],
    ];

    return {
      scaleId: scaleId as number,
      minGrade: minGrade as number,
      maxGrade: maxGrade as number,
      stanValue: convertedGrade as number,
    };
  });

  return parsedRows;
}

function extractTGradeTable(workBook: Workbook): TGradeTableRow[] {
  const tableData = getSheetRows(workBook, "Таблица перевода в Т-баллы");

  const parsedRows: TGradeTableRow[] = tableData.map((entry: any) => {
    const [scaleId, rawGrade, convertedGrade] = [
      entry["ID Шкалы"],
      entry["Сырой балл"],
      entry["Значение Т-балла"],
    ];

    return {
      scaleId: scaleId as number,
      rawGrade: rawGrade as number,
      convertedGrade: convertedGrade as number,
    };
  });

  return parsedRows;
}

function extractSummaryTable(workBook: Workbook): SummaryTableRow[] {
  const tableData = getSheetRows(workBook, "Характеристика");

  const parsedRows: SummaryTableRow[] = tableData.map((entry: any) => {
    const [
      scaleId,
      strategy,
      minGrade,
      maxGrade,
      minTGrade,
      maxTGrade,
      minStan,
      maxStan,
      summaryText,
    ] = [
      entry["ID Шкалы"],
      entry["Метод получения характеристики"],
      entry["Минимальный балл"],
      entry["Максимальный балл"],
      entry["Минимальный Т-балл"],
      entry["Максимальный Т-балл"],
      entry["Минимальный СТЭН"],
      entry["Максимальный СТЭН"],
      entry["Текст характеристики"],
    ];

    return {
      scaleId: scaleId as number,
      strategy: strategy as string,
      minGrade: minGrade as number,
      maxGrade: maxGrade as number,
      minTGrade: minTGrade as number,
      maxTGrade: maxTGrade as number,
      minStanValue: minStan as number,
      maxStanValue: maxStan as number,
      summaryText: summaryText as string,
    };
  });

  return parsedRows;
}
