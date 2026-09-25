"use client";

import { uploadTestSubmission } from "@/actions/test-submission/upload-test-submission-action";
import { DoneStep } from "@/components/runner/done-step";
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
  // Answers taken back with Back, so the choice is still selected when the question reappears.
  const [undone, setUndone] = useState<TestQuestionResponse[]>([]);
  const question = questions[responses.length];

  const submission = useMutation({
    mutationFn: () => uploadTestSubmission(test.id, responses),
    onSuccess: () => router.push("/tests?done=1"),
    onError: () => toast({ title: common("error"), description: t("saveError"), variant: "destructive" }),
  });

  const back = () => {
    const last = responses[responses.length - 1];
    setResponses(responses.slice(0, -1));
    setUndone([last, ...undone]);
  };

  if (question) {
    return (
      <TestQuestionCard
        key={question.id}
        question={question}
        position={responses.length + 1}
        total={questions.length}
        initialChoiceId={undone.find((response) => response.questionId === question.id)?.choiceId}
        onBack={responses.length > 0 ? back : undefined}
        onAnswer={(choiceId) => {
          setResponses([...responses, { questionId: question.id, choiceId }]);
          setUndone(undone.filter((response) => response.questionId !== question.id));
        }}
      />
    );
  }

  return (
    <DoneStep
      text={t("testDoneText", { name: test.name })}
      pending={submission.isPending}
      onFinish={() => submission.mutate()}
      onBack={back}
    />
  );
}
