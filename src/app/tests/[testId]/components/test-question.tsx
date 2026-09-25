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
import { TestQuestion } from "@/utils/constants";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";

// Question types as written in the test spreadsheet template.
const SINGLE_CHOICE = "Один из списка";
const SINGLE_CHOICE_WITH_OTHER = "Один из списка + свой ответ";

type Properties = {
  question: TestQuestion;
  position: number;
  total: number;
  onAnswer: (choiceId: number) => void;
};

export function TestQuestionCard({ question, position, total, onAnswer }: Properties) {
  const t = useTranslations("runner");
  const common = useTranslations("common");
  const [choiceId, setChoiceId] = useState<number>();
  const [otherValue, setOtherValue] = useState("");
  // Free-text answers are recorded as one extra choice after the listed ones.
  const otherChoiceId = question.choices.length + 1;

  return (
    <Card className="border-t-8 border-t-primary max-w-3xl w-full">
      <CardHeader>
        <CardDescription>{t("progress", { current: position, total })}</CardDescription>
        <CardTitle>{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {(question.type === SINGLE_CHOICE || question.type === SINGLE_CHOICE_WITH_OTHER) &&
          question.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={choiceId === choice.id}
              className={cn(
                "px-4 py-2 border rounded-md text-left transition-all hover:border-primary",
                choiceId === choice.id && "border-primary bg-accent"
              )}
              onClick={() => setChoiceId(choice.id)}
            >
              {choice.text}
            </button>
          ))}

        {question.type === SINGLE_CHOICE_WITH_OTHER && (
          <Input
            value={otherValue}
            onFocus={() => setChoiceId(otherChoiceId)}
            onChange={(event) => setOtherValue(event.target.value)}
            placeholder={t("answerPlaceholder")}
          />
        )}
      </CardContent>
      <CardFooter className="w-full">
        <Button
          className="w-full"
          disabled={choiceId === undefined}
          onClick={() => choiceId !== undefined && onAnswer(choiceId)}
        >
          {common("next")}
        </Button>
      </CardFooter>
    </Card>
  );
}
