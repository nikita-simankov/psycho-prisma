import { FormData, FormQuestion, FormQuestionChoice } from "../constants";
import { getSheetRows, readWorkbook, type SheetRow } from "./workbook";

export async function extractFormQuestions(
  file: File,
  formData: FormData,
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
) {
  const workBook = await readWorkbook(file);
  const fieldsData = getSheetRows(workBook, workBook.sheetNames[0]);

  const parsedFormQuestions = fieldsData.map((column: SheetRow) => {
    const [questionId, questionText, questionType, questionChoices] = [
      column["№ Вопроса"] as number,
      column["Текст вопроса"] as string,
      column["Тип ответа"] as string,
      column["Варианты ответа"] as string,
    ];

    return {
      id: questionId,
      text: questionText,
      type: questionType === "Список" ? "List" : "Text",
      choices:
        questionType === "Список"
          ? questionChoices.split("; ").map((choice, index) => {
              return {
                id: index + 1,
                text: choice,
              } as FormQuestionChoice;
            })
          : [],
    };
  });

  setFormData({
    ...formData,

    questions: parsedFormQuestions as FormQuestion[],
  });
}
