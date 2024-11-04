import { TestSubmission } from "@prisma/client";
import { TestQuestion, TestQuestionResponse } from "@/utils/constants";

interface Properties {
  questions: string;
  testSubmission: TestSubmission;
}

export default function AnswerTable({
  questions,
  testSubmission,
}: Readonly<Properties>) {
  const parsedQuestions = JSON.parse(questions) as TestQuestion[];
  const questionAnswers = JSON.parse(
    testSubmission.submission
  ) as TestQuestionResponse[];

  return (
    <table className="border">
      <tr>
        <th className="border">№ п/п</th>
        <th className="border">Вопрос</th>
        <th className="border">Ответ</th>
      </tr>
      {parsedQuestions.map((question) => {
        const questionAnswerId = questionAnswers.find(
          (questionAnswer) => questionAnswer.questionId === question.id
        )?.choiceId;

        const questionAnswer = parsedQuestions
          .find((lookupQuestion) => lookupQuestion.id === question.id)
          ?.choices.find((choice) => choice.id === questionAnswerId);

        return (
          <tr className="text-center">
            <td className="border">{question.id}</td>
            <td className="border">{question.text}</td>
            <td className="border">{questionAnswer?.text}</td>
          </tr>
        );
      })}
    </table>
  );
}
