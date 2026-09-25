"use client";

import { uploadFormSubmission } from "@/actions/form-submission/upload-form-submission-action";
import { ChoiceList } from "@/components/runner/choice-list";
import { DoneStep } from "@/components/runner/done-step";
import { QuestionStep } from "@/components/runner/question-step";
import { estimateMinutesLeft, RunnerHeader } from "@/components/runner/runner-header";
import { useDraft, type Answer } from "@/components/runner/use-draft";
import { useRunnerKeys } from "@/components/runner/use-runner-keys";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { FormQuestion } from "@/utils/constants";
import { Form } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Properties = {
  form: Pick<Form, "id" | "name" | "ttc" | "questions">;
  doneHref: string;
  pauseHref: string;
  assignmentId?: string;
  initialDraft?: { answers: Record<string, Answer>; timings: Record<string, number> } | null;
};

// Walks through a questionnaire one question at a time, saving progress as it goes.
export function FormRunner({ form, doneHref, pauseHref, assignmentId, initialDraft }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");
  const router = useRouter();
  const questions = useMemo(() => JSON.parse(form.questions) as FormQuestion[], [form.questions]);
  const draft = useDraft({ kind: "form", instrumentId: form.id, assignmentId, initial: initialDraft });
  const { answers } = draft;

  // Text answers may be left empty, so a question counts as seen once it has any saved value.
  const [index, setIndex] = useState(() => {
    const first = questions.findIndex((question) => initialDraft?.answers[question.id] === undefined);
    const resume = first === -1 ? questions.length : first;
    // A text answer may have been left half-written, so reopen it rather than skip past it.
    return resume > 0 && questions[resume - 1].type === "Text" ? resume - 1 : resume;
  });
  const question = questions[index];

  const submission = useMutation({
    mutationFn: async () => {
      await draft.flush();
      return uploadFormSubmission(
        form.id,
        questions.map((entry) => ({ fieldId: entry.id, response: String(answers[entry.id] ?? "") })),
        assignmentId,
        draft.timings.current
      );
    },
    onSuccess: () => router.push(doneHref),
    onError: () => toast({ title: common("error"), description: t("saveError"), variant: "destructive" }),
  });

  const value = question ? String(answers[question.id] ?? "") : "";
  const isText = question?.type === "Text";
  const selected = question?.choices.find((choice) => choice.text === value)?.id;
  const canContinue = isText || selected !== undefined;

  const go = (next: number) => {
    setIndex(Math.max(0, Math.min(questions.length, next)));
    draft.restartClock();
  };
  const next = () => {
    if (!canContinue) return;
    // An untouched text answer is saved as empty so resuming starts after it.
    if (isText && answers[question.id] === undefined) draft.answer(question.id, "");
    go(index + 1);
  };
  const back = index > 0 ? () => go(index - 1) : undefined;
  const pause = async () => {
    await draft.flush();
    router.push(pauseHref);
  };

  useRunnerKeys({
    onDigit: (digit) => {
      const choice = question && !isText ? question.choices[digit - 1] : undefined;
      if (choice) draft.answer(question.id, choice.text);
    },
    onEnter: question ? next : () => !submission.isPending && submission.mutate(),
    onBack: question ? back : () => go(questions.length - 1),
  });

  if (!question) {
    return (
      <DoneStep
        text={t("formDoneText", { name: form.name })}
        pending={submission.isPending}
        onFinish={() => submission.mutate()}
        onBack={() => go(questions.length - 1)}
      />
    );
  }

  const answered = questions.filter((entry) => answers[entry.id] !== undefined).length;

  return (
    <QuestionStep
      header={
        <RunnerHeader
          label={t("progress", { current: index + 1, total: questions.length })}
          answered={answered}
          total={questions.length}
          minutesLeft={estimateMinutesLeft(questions.length - answered, questions.length, form.ttc, draft.timings.current)}
          status={draft.status}
          onPause={pause}
        />
      }
      stepKey={index}
      title={question.text}
      canContinue={canContinue}
      onNext={next}
      onBack={back}
      hint={isText ? undefined : t("questionKeys")}
    >
      {isText ? (
        <Textarea
          autoFocus
          rows={3}
          className="rounded-xl text-base"
          value={value}
          aria-label={question.text}
          onChange={(event) => draft.answer(question.id, event.target.value)}
          placeholder={t("answerPlaceholder")}
        />
      ) : (
        <ChoiceList
          choices={question.choices}
          value={selected}
          label={question.text}
          onChange={(choiceId) => draft.answer(question.id, question.choices.find((choice) => choice.id === choiceId)!.text)}
        />
      )}
    </QuestionStep>
  );
}
