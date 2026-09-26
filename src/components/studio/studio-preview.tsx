"use client";

import { ChoiceList } from "@/components/runner/choice-list";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { EditableQuestion } from "./question-list";

// What respondents will see, drawn from the editor's unsaved content with the runner's own
// components. Answers picked here only highlight locally; nothing is saved.
export function StudioPreview({
  questions,
  index,
  onIndexChange,
  className,
}: {
  questions: EditableQuestion[];
  // The question shown; the editor moves it when a question is focused in the list.
  index: number;
  onIndexChange: (index: number) => void;
  className?: string;
}) {
  const t = useTranslations("studio.preview");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const total = questions.length;
  // Questions can be removed while the preview points past the end.
  const current = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
  const question = questions[current];

  return (
    <section aria-label={t("title")} className={cn("mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border bg-card p-4 sm:p-6", className)}>
      {question ? (
        <>
          <Eyebrow>{t("position", { number: current + 1, total })}</Eyebrow>
          <h2 className="font-heading text-2xl font-normal leading-snug text-pretty">
            {question.text.trim() || <span className="text-muted-foreground">{t("untitled")}</span>}
          </h2>
          {question.type === "Text" ? (
            <Textarea rows={3} placeholder={t("textPlaceholder")} aria-label={question.text} />
          ) : question.choices.length > 0 ? (
            <ChoiceList
              choices={question.choices}
              value={answers[question.id]}
              onChange={(choiceId) =>
                setAnswers((previous) => ({
                  ...previous,
                  [question.id]: choiceId,
                }))
              }
              label={question.text}
            />
          ) : (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">{t("noChoices")}</p>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-foreground/80 pt-4">
            <Button type="button" variant="outline" size="sm" disabled={current === 0} onClick={() => onIndexChange(current - 1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t("previous")}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={current >= total - 1} onClick={() => onIndexChange(current + 1)}>
              {t("next")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("notSaved")}</p>
        </>
      ) : (
        <>
          <Eyebrow>{t("title")}</Eyebrow>
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
        </>
      )}
    </section>
  );
}
