"use client";

import { useEffect, useState } from "react";
import { TestQuestionCard } from "./test-question";
import { TestQuestion, TestQuestionResponse } from "@/utils/constants";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Test } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { uploadTestSubmission } from "@/actions/test-submission/upload-test-submission-action";

type Properties = {
  test: Test;
  questions: TestQuestion[];
};

export const TestRunner: React.FC<Properties> = ({ test, questions }) => {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [questionResponses, setQuestionResponses] = useState<
    TestQuestionResponse[]
  >([]);

  const { mutate: uploadSubmission } = useMutation({
    mutationFn: () => uploadTestSubmission(test.id, questionResponses),

    onSuccess: (test) => {
      fetch(
        "http://localhost:3000/dashboard/tests/" +
          test.testId +
          "/results/" +
          test.id,
        {
          method: "GET",
        }
      );
      router.push("/tests");
    },
  });

  if (questionIndex <= questions.length - 1) {
    return (
      <TestQuestionCard
        question={questions[questionIndex]}
        responses={questionResponses}
        setResponses={setQuestionResponses}
        questionIndex={questionIndex}
        setQuestionIndex={setQuestionIndex}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Поздравляем!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Вы успешно прошли тест "{test.name}". Нажмите "Завершить", чтобы
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
