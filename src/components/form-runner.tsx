"use client";

import { uploadFormSubmission } from "@/actions/form-submission/upload-form-submission-action";
import { ChoiceList } from "@/components/runner/choice-list";
import { DoneStep } from "@/components/runner/done-step";
import { QuestionStep } from "@/components/runner/question-step";
import { Textarea } from "@/components/ui/textarea";
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
  assignmentId?: string;
};

// Walks through a questionnaire one question at a time, then saves the answers.
export function FormRunner({ form, doneHref, assignmentId }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");
  const router = useRouter();
  const questions = useMemo(() => JSON.parse(form.questions) as FormQuestion[], [form.questions]);
  // Drafts keep what was typed or picked per question, so Back doesn't lose it.
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [responses, setResponses] = useState<FormQuestionResponse[]>([]);
  const questionIndex = responses.length;
  const question = questions[questionIndex];

  const submission = useMutation({
    mutationFn: () => uploadFormSubmission(form.id, responses, assignmentId),
    onSuccess: () => router.push(doneHref),
    onError: () => toast({ title: common("error"), description: t("saveError"), variant: "destructive" }),
  });

  const back = () => setResponses(responses.slice(0, -1));

  if (!question) {
    return (
      <DoneStep
        text={t("formDoneText", { name: form.name })}
        pending={submission.isPending}
        onFinish={() => submission.mutate()}
        onBack={back}
      />
    );
  }

  const draft = drafts[question.id] ?? "";
  const setDraft = (value: string) => setDrafts({ ...drafts, [question.id]: value });
  const isText = question.type === "Text";
  const selected = question.choices.find((choice) => choice.text === draft)?.id;

  return (
    <QuestionStep
      key={question.id}
      position={questionIndex + 1}
      total={questions.length}
      title={question.text}
      canContinue={isText || selected !== undefined}
      onNext={() => setResponses([...responses, { fieldId: question.id, response: draft }])}
      onBack={questionIndex > 0 ? back : undefined}
    >
      {isText ? (
        <Textarea
          autoFocus
          rows={3}
          className="rounded-xl text-base"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("answerPlaceholder")}
        />
      ) : (
        <ChoiceList
          choices={question.choices}
          value={selected}
          onChange={(choiceId) => setDraft(question.choices.find((choice) => choice.id === choiceId)!.text)}
        />
      )}
    </QuestionStep>
  );
}
