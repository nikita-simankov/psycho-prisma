"use client";

import { uploadFormSubmission } from "@/actions/form-submission/upload-form-submission-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormQuestion, FormQuestionResponse } from "@/utils/constants";
import { Form } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type Properties = {
  form: Form;
};

export const FormRunner: React.FC<Properties> = ({ form }) => {
  const router = useRouter();
  const questions = JSON.parse(form?.questions!) as FormQuestion[];
  const [textValue, setTextValue] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [questionResponses, setQuestionResponses] = useState<
    FormQuestionResponse[]
  >([]);

  const { mutate: uploadSubmission } = useMutation({
    mutationFn: () => uploadFormSubmission(form.id, questionResponses),

    onSuccess: () => {
      router.push("/forms");
    },
  });

  if (questionIndex <= questions.length - 1) {
    return (
      <>
        {questionIndex <= questions.length - 1 &&
        questions[questionIndex].type === "Text" ? (
          <Card className="max-w-7xl w-full">
            <CardHeader>
              <CardTitle>{questions[questionIndex].text}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={textValue}
                onChange={(e) => {
                  setTextValue(e.target.value);
                }}
                placeholder="Ваш ответ"
              />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  setQuestionResponses([
                    ...questionResponses,
                    {
                      fieldId: questions[questionIndex].id,
                      response: textValue,
                    },
                  ]);

                  setTextValue("");
                  setQuestionIndex(questionIndex + 1);
                }}
              >
                Далее
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="max-w-7xl w-full">
            <CardHeader>
              <CardTitle>{questions[questionIndex].text}</CardTitle>
            </CardHeader>
            <CardContent>
              {questions[questionIndex].choices.map((choice) => {
                return (
                  <div
                    className="px-4 py-2 border rounded-md transition-all cursor-pointer hover:border-primary"
                    onClick={() => {
                      setQuestionResponses([
                        ...questionResponses,
                        {
                          fieldId: questions[questionIndex].id,
                          response: choice.text,
                        },
                      ]);

                      setQuestionIndex(questionIndex + 1);
                    }}
                  >
                    {choice.text}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Поздравляем!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Вы успешно заполнили "{form.name}". Нажмите "Завершить", чтобы
          вернуться на страницу тестов
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => {
            uploadSubmission();
          }}
        >
          Завершить
        </Button>
      </CardFooter>
    </Card>
  );
};
