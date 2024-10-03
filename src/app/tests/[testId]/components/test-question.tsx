import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TestQuestion,
  TestQuestionChoice,
  TestQuestionResponse,
} from "@/utils/constants";
import clsx from "clsx";
import React, { useState } from "react";

type Properties = {
  question: TestQuestion;
  responses: TestQuestionResponse[];
  questionIndex: number;
  setResponses: React.Dispatch<React.SetStateAction<TestQuestionResponse[]>>;
  setQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
};

export const TestQuestionCard: React.FC<Properties> = ({
  question,
  responses,
  setResponses,
  questionIndex,
  setQuestionIndex,
}) => {
  const [choiceId, setChoiceId] = useState<number>();
  const [responseValue, setResponseValue] = useState<string>("");

  return (
    <Card className="border-t-8 border-t-primary max-w-5xl w-full">
      <CardHeader>
        <CardTitle>
          Вопрос {question.id}. {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {question.choices && (
          <>
            {question.type === "Один из списка" &&
              question.choices.map((choice) => (
                <div
                  className={clsx(
                    "px-4 py-2 border rounded-md transition-all cursor-pointer hover:border-primary",
                    {
                      "border-primary": choiceId === choice.id,
                    }
                  )}
                  onClick={() => {
                    setChoiceId(choice.id);
                  }}
                >
                  {choice.text}
                </div>
              ))}

            {question.type === "Один из списка + свой ответ" && (
              <div className="flex flex-col gap-2">
                {question.choices.map((choice) => (
                  <div
                    className="px-4 py-2 border rounded-md transition-all cursor-pointer hover:border-primary"
                    onClick={() => {
                      setChoiceId(choice.id);
                    }}
                  >
                    {choice.text}
                  </div>
                ))}
                <Input
                  value={responseValue}
                  onFocus={() => setChoiceId(question.choices.length + 1)}
                  onChange={(e) => setResponseValue(e.target.value)}
                  placeholder="Ваш ответ"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="w-full">
        <Button
          className="w-full"
          onClick={() => {
            setResponses([
              ...responses,
              {
                questionId: question.id,
                choiceId: choiceId!,
              },
            ]);
            setQuestionIndex(questionIndex + 1);
          }}
        >
          Далее
        </Button>
      </CardFooter>
    </Card>
  );
};
