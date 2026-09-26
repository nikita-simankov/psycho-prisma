"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { nextId } from "@/utils/instrument-content";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

export type EditableQuestion = { id: number; text: string; type: string; choices: { id: number; text: string }[] };

// Questions with their answer choices. Ids never change once given, so scoring keys and
// translations stay attached to the right question when others are added, moved or removed.
export function QuestionList<Q extends EditableQuestion>({
  questions,
  onChange,
  withTypes = false,
}: {
  questions: Q[];
  onChange: (questions: Q[]) => void;
  // Questionnaires can have free-text questions; tests always offer choices.
  withTypes?: boolean;
}) {
  const t = useTranslations("studio.questions");

  const set = (index: number, question: Q) => onChange(questions.map((entry, i) => (i === index ? question : entry)));
  const move = (index: number, by: number) => {
    const next = [...questions];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };
  const add = () => {
    const previous = questions[questions.length - 1];
    // A new question offers the same choices as the one before, the usual case for rating scales.
    const choices = previous && (!withTypes || previous.type === "List") ? previous.choices.map((choice) => ({ ...choice })) : [];
    onChange([
      ...questions,
      { id: nextId(questions), text: "", type: withTypes ? previous?.type ?? "List" : "List", choices } as Q,
    ]);
  };

  return (
    <div className="flex flex-col gap-3">
      {questions.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>}
      {questions.map((question, index) => (
        <section key={question.id} className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:p-4" aria-label={t("number", { number: index + 1 })}>
          <div className="flex items-start gap-2">
            <span className="mt-2 w-7 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">{index + 1}.</span>
            <Textarea
              aria-label={t("text", { number: index + 1 })}
              className="min-h-10"
              rows={1}
              value={question.text}
              placeholder={t("textPlaceholder")}
              onChange={(event) => set(index, { ...question, text: event.target.value })}
            />
            <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
              <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t("up")}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" disabled={index === questions.length - 1} onClick={() => move(index, 1)} aria-label={t("down")}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(questions.filter((_, i) => i !== index))} aria-label={t("remove", { number: index + 1 })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:pl-9">
            {withTypes && (
              <div className="flex items-center gap-2">
                <Label htmlFor={`type-${question.id}`} className="text-xs text-muted-foreground">
                  {t("type")}
                </Label>
                <Select value={question.type} onValueChange={(type) => set(index, { ...question, type, choices: type === "Text" ? [] : question.choices })}>
                  <SelectTrigger id={`type-${question.id}`} className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="List">{t("types.List")}</SelectItem>
                    <SelectItem value="Text">{t("types.Text")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(!withTypes || question.type === "List") && (
              <>
                <ol className="flex flex-col gap-1.5">
                  {question.choices.map((choice, choiceIndex) => (
                    <li key={choice.id} className="flex items-center gap-2">
                      <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{choiceIndex + 1}</span>
                      <Input
                        className="h-9"
                        aria-label={t("choice", { number: choiceIndex + 1, question: index + 1 })}
                        value={choice.text}
                        onChange={(event) =>
                          set(index, { ...question, choices: question.choices.map((entry) => (entry.id === choice.id ? { ...entry, text: event.target.value } : entry)) })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => set(index, { ...question, choices: question.choices.filter((entry) => entry.id !== choice.id) })}
                        aria-label={t("removeChoice", { number: choiceIndex + 1 })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ol>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={() => set(index, { ...question, choices: [...question.choices, { id: nextId(question.choices), text: "" }] })}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("addChoice")}
                </Button>
              </>
            )}
          </div>
        </section>
      ))}
      <Button type="button" variant="outline" className="w-fit" onClick={add}>
        <Plus className="mr-2 h-4 w-4" />
        {t("add")}
      </Button>
    </div>
  );
}
