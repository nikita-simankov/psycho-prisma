import * as xlsx from "xlsx";
import { FormData, FormQuestionChoice } from "../constants";

export function extractFormQuestions(
  file: File,
  formData: FormData,
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
) {
  const fileReader = new FileReader();

  fileReader.readAsArrayBuffer(file);
  fileReader.onload = (event: ProgressEvent<FileReader>) => {
    const bufferArray = event.target?.result;
    const workBook: xlsx.WorkBook = xlsx.read(bufferArray, {
      type: "buffer",
    });

    const fieldsSheetName = workBook.SheetNames[0];
    const fieldsSheet = workBook.Sheets[fieldsSheetName];
    const fieldsData = xlsx.utils.sheet_to_json(fieldsSheet);

    const parsedFormQuestions = fieldsData.map((column: any) => {
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

      // @ts-ignore
      questions: parsedFormQuestions,
    });
  };
}
