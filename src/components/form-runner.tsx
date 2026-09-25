"use client";

import { uploadFormSubmission } from "@/actions/form-submission/upload-form-submission-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { FormQuestion, FormQuestionResponse } from "@/utils/constants";
import { Form } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Properties = {
  form: Form;
  doneHref: string;
};

// Walks through a questionnaire one question at a time, then saves the answers.
export function FormRunner({ form, doneHref }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");
  const router = useRouter();
  const questions = useMemo(
    () => JSON.parse(form.questions) as FormQuestion[],
    [form.questions]
  );
  const [textValue, setTextValue] = useState("");
  const [responses, setResponses] = useState<FormQuestionResponse[]>([]);
  const questionIndex = responses.length;
  const question = questions[questionIndex];

  const submission = useMutation({
    mutationFn: () => uploadFormSubmission(form.id, responses),
    onSuccess: () => router.push(doneHref),
    onError: () =>
      toast({ title: common("error"), description: t("saveError"), variant: "destructive" }),
  });

  const answer = (response: string) =>
    setResponses([...responses, { fieldId: question.id, response }]);

  if (question) {
    return (
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <CardDescription>
            {t("progress", { current: questionIndex + 1, total: questions.length })}
          </CardDescription>
          <CardTitle>{question.text}</CardTitle>
        </CardHeader>

        {question.type === "Text" ? (
          <>
            <CardContent>
              <Input
                value={textValue}
                onChange={(event) => setTextValue(event.target.value)}
                placeholder={t("answerPlaceholder")}
              />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  answer(textValue);
                  setTextValue("");
                }}
              >
                {common("next")}
              </Button>
            </CardFooter>
          </>
        ) : (
          <CardContent className="flex flex-col gap-2">
            {question.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="px-4 py-2 border rounded-md text-left transition-all hover:border-primary"
                onClick={() => answer(choice.text)}
              >
                {choice.text}
              </button>
            ))}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl w-full">
      <CardHeader>
        <CardTitle>{t("doneTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {t("formDoneText", { name: form.name })}
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
