"use client";

import { uploadTestSubmission } from "@/actions/test-submission/upload-test-submission-action";
import { ChoiceList } from "@/components/runner/choice-list";
import { DoneStep } from "@/components/runner/done-step";
import { QuestionStep } from "@/components/runner/question-step";
import { estimateMinutesLeft, RunnerHeader } from "@/components/runner/runner-header";
import { StatementGrid } from "@/components/runner/statement-grid";
import { useDraft, type Answer } from "@/components/runner/use-draft";
import { useRunnerKeys } from "@/components/runner/use-runner-keys";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { TestQuestion } from "@/utils/constants";
import { Test } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// Question types as written in the test spreadsheet template.
const SINGLE_CHOICE = "Один из списка";
const SINGLE_CHOICE_WITH_OTHER = "Один из списка + свой ответ";

const PAGE_SIZE = 10;
const PAGED_FROM = 20;

type Properties = {
  test: Pick<Test, "id" | "name" | "ttc">;
  questions: TestQuestion[];
  assignmentId?: string;
  pauseHref: string;
  // Where to go after submitting: the round's next item, or back home.
  doneHref?: string;
  initialDraft?: { answers: Record<string, Answer>; timings: Record<string, number> } | null;
};

// Long questionnaires where every statement has the same answers are shown a page at a time.
function sharedChoices(questions: TestQuestion[]) {
  if (questions.length < PAGED_FROM) return null;
  const signature = (question: TestQuestion) => question.choices.map((choice) => `${choice.id}:${choice.text.trim()}`).join("|");
  const first = signature(questions[0]);
  return questions.every((question) => question.type === SINGLE_CHOICE && signature(question) === first)
    ? questions[0].choices
    : null;
}

export function TestRunner({ test, questions, assignmentId, pauseHref, doneHref, initialDraft }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");
  const router = useRouter();

  // Answers to questions that no longer exist are dropped.
  const initial = useMemo(() => {
    if (!initialDraft) return null;
    const ids = new Set(questions.map((question) => String(question.id)));
    const keep = <T,>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([id]) => ids.has(id)));
    return { answers: keep(initialDraft.answers), timings: keep(initialDraft.timings) };
  }, [initialDraft, questions]);

  const draft = useDraft({ kind: "test", instrumentId: test.id, assignmentId, initial });
  const { answers } = draft;
  const choices = useMemo(() => sharedChoices(questions), [questions]);
  const stepSize = choices ? PAGE_SIZE : 1;
  const steps = Math.ceil(questions.length / stepSize);

  // Resume at the first step with something unanswered.
  const [step, setStep] = useState(() => {
    const index = questions.findIndex((question) => initial?.answers[question.id] === undefined);
    return index === -1 ? steps : Math.floor(index / stepSize);
  });

  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const shown = questions.slice(step * stepSize, (step + 1) * stepSize);
  const complete = shown.every((question) => answers[question.id] !== undefined);

  const submission = useMutation({
    mutationFn: async () => {
      await draft.flush();
      return uploadTestSubmission(
        test.id,
        questions.map((question) => ({ questionId: question.id, choiceId: Number(answers[question.id]) })),
        assignmentId,
        draft.timings.current
      );
    },
    onSuccess: () => router.push(doneHref ?? (pauseHref === "/assessments" ? "/assessments?done=1" : pauseHref)),
    onError: () => toast({ title: common("error"), description: t("saveError"), variant: "destructive" }),
  });

  const go = (next: number) => {
    setStep(Math.max(0, Math.min(steps, next)));
    draft.restartClock();
  };
  const next = () => complete && go(step + 1);
  const back = step > 0 ? () => go(step - 1) : undefined;
  const pause = async () => {
    await draft.flush();
    router.push(pauseHref);
  };

  useRunnerKeys({
    onDigit: (digit) => {
      if (step >= steps) return;
      if (choices) {
        // The statement holding focus, otherwise the first one still unanswered on the page.
        const focused = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-statement]");
        const target =
          shown.find((question) => String(question.id) === focused?.dataset.statement) ??
          shown.find((question) => answers[question.id] === undefined);
        const choice = choices[digit - 1];
        if (target && choice) draft.answer(target.id, choice.id);
      } else {
        const choice = shown[0].choices[digit - 1];
        if (choice) draft.answer(shown[0].id, choice.id);
      }
    },
    onEnter: step < steps ? next : () => !submission.isPending && submission.mutate(),
    onBack: step >= steps ? () => go(step - 1) : back,
  });

  if (step >= steps) {
    return (
      <DoneStep
        text={t("testDoneText", { name: test.name })}
        pending={submission.isPending}
        onFinish={() => submission.mutate()}
        onBack={() => go(steps - 1)}
      />
    );
  }

  const header = (
    <RunnerHeader
      label={
        choices
          ? t("statements", { from: step * PAGE_SIZE + 1, to: step * PAGE_SIZE + shown.length, total: questions.length })
          : t("progress", { current: step + 1, total: questions.length })
      }
      answered={answeredCount}
      total={questions.length}
      minutesLeft={estimateMinutesLeft(questions.length - answeredCount, questions.length, test.ttc, draft.timings.current)}
      status={draft.status}
      onPause={pause}
    />
  );

  if (choices) {
    return (
      <QuestionStep
        header={header}
        stepKey={step}
        title={t("pageTitle", { page: step + 1, pages: steps })}
        canContinue={complete}
        onNext={next}
        onBack={back}
        hint={t("pageKeys")}
      >
        <StatementGrid
          statements={shown.map((question) => ({
            id: question.id,
            text: question.text,
            number: questions.indexOf(question) + 1,
          }))}
          choices={choices}
          answers={answers}
          onAnswer={(id, choiceId) => draft.answer(id, choiceId)}
        />
      </QuestionStep>
    );
  }

  const question = shown[0];
  return (
    <QuestionStep
      header={header}
      stepKey={step}
      title={question.text}
      canContinue={complete}
      onNext={next}
      onBack={back}
      hint={t("questionKeys")}
    >
      <SingleQuestion question={question} value={answers[question.id]} onAnswer={(choiceId) => draft.answer(question.id, choiceId)} />
    </QuestionStep>
  );
}

function SingleQuestion({
  question,
  value,
  onAnswer,
}: {
  question: TestQuestion;
  value: Answer | undefined;
  onAnswer: (choiceId: number) => void;
}) {
  const t = useTranslations("runner");
  const [otherValue, setOtherValue] = useState("");
  // Free-text answers are recorded as one extra choice after the listed ones.
  const otherChoiceId = question.choices.length + 1;

  return (
    <>
      {(question.type === SINGLE_CHOICE || question.type === SINGLE_CHOICE_WITH_OTHER) && (
        <ChoiceList choices={question.choices} value={value as number | undefined} onChange={onAnswer} label={question.text} />
      )}
      {question.type === SINGLE_CHOICE_WITH_OTHER && (
        <Input
          className="h-12"
          value={otherValue}
          onFocus={() => onAnswer(otherChoiceId)}
          onChange={(event) => setOtherValue(event.target.value)}
          placeholder={t("answerPlaceholder")}
        />
      )}
    </>
  );
}
