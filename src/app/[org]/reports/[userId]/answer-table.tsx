import { TestQuestion, TestQuestionResponse } from "@/utils/constants";
import { useTranslations } from "next-intl";

interface Properties {
  questions: TestQuestion[];
  responses: TestQuestionResponse[];
}

export default function AnswerTable({ questions, responses }: Readonly<Properties>) {
  const t = useTranslations("results.table");
  const choiceByQuestion = new Map(
    responses.map((response) => [response.questionId, response.choiceId])
  );

  return (
    <div className="overflow-x-auto w-full">
      <table className="border w-full text-sm">
        <thead>
          <tr>
            <th className="border p-1">{t("number")}</th>
            <th className="border p-1">{t("question")}</th>
            <th className="border p-1">{t("answer")}</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => {
            const choiceId = choiceByQuestion.get(question.id);
            const answer = question.choices.find((choice) => choice.id === choiceId);

            return (
              <tr key={question.id}>
                <td className="border p-1 text-center">{question.id}</td>
                <td className="border p-1">{question.text}</td>
                <td className="border p-1">{answer?.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
