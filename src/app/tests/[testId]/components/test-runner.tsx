"use client";

import { uploadTestSubmission } from "@/actions/test-submission/upload-test-submission-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { TestQuestion, TestQuestionResponse } from "@/utils/constants";
import { Test } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TestQuestionCard } from "./test-question";

type Properties = {
  test: Test;
  questions: TestQuestion[];
};

export function TestRunner({ test, questions }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");
  const router = useRouter();
  const [responses, setResponses] = useState<TestQuestionResponse[]>([]);
  const question = questions[responses.length];

  const submission = useMutation({
    mutationFn: () => uploadTestSubmission(test.id, responses),
    onSuccess: () => router.push("/tests"),
    onError: () =>
      toast({ title: common("error"), description: t("saveError"), variant: "destructive" }),
  });

  if (question) {
    return (
      <TestQuestionCard
        key={question.id}
        question={question}
        position={responses.length + 1}
        total={questions.length}
        onAnswer={(choiceId) =>
          setResponses([...responses, { questionId: question.id, choiceId }])
        }
      />
    );
  }

  return (
    <Card className="max-w-3xl w-full">
      <CardHeader>
        <CardTitle>{t("doneTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {t("testDoneText", { name: test.name })}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={submission.isPending}
          onClick={() => submission.mutate()}
        >
          {common("finish")}
        </Button>
      </CardFooter>
    </Card>
  );
}
