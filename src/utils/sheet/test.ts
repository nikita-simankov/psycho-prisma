import * as xlsx from "xlsx";
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

export function extractTestData(
  file: File,
  testData: TestData,
  setTestData: React.Dispatch<React.SetStateAction<TestData>>
) {
  const fileReader = new FileReader();

  fileReader.readAsArrayBuffer(file);
  fileReader.onload = (event: ProgressEvent<FileReader>) => {
    const bufferArray = event.target?.result;
    const workBook: xlsx.WorkBook = xlsx.read(bufferArray, {
      type: "buffer",
    });

    const scales = extractScales(workBook);
    const questions = extractQuestions(workBook);
    const stanTable = extractStanTable(workBook);
    const tGradeTable = extractTGradeTable(workBook);
    const summaryTable = extractSummaryTable(workBook);

    setTestData({
      ...testData,
      scales: scales,
      questions: questions,
      stanTable: stanTable,
      tGradeTable: tGradeTable,
      summaryTable: summaryTable,
    });
  };
}

function extractScales(workBook: xlsx.WorkBook) {
  const scalesSheet = workBook.Sheets["Обработка"];
  const scales = xlsx.utils.sheet_to_json(scalesSheet);

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

function extractQuestions(workBook: xlsx.WorkBook): TestQuestion[] {
  const questionsSheet = workBook.Sheets["Список вопросов"];
  const questions = xlsx.utils.sheet_to_json(questionsSheet);

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

function extractStanTable(workBook: xlsx.WorkBook): StanTableRow[] {
  const tableSheet = workBook.Sheets["Таблица перевода в СТЭН"];
  const tableData = xlsx.utils.sheet_to_json(tableSheet);

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

function extractTGradeTable(workBook: xlsx.WorkBook): TGradeTableRow[] {
  const tableSheet = workBook.Sheets["Таблица перевода в Т-баллы"];
  const tableData = xlsx.utils.sheet_to_json(tableSheet);

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

function extractSummaryTable(workBook: xlsx.WorkBook): SummaryTableRow[] {
  const tableSheet = workBook.Sheets["Характеристика"];
  const tableData = xlsx.utils.sheet_to_json(tableSheet);

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
