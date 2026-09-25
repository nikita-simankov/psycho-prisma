import { QuestionStep } from "@/components/runner/question-step";
import { ChoiceList } from "@/components/runner/choice-list";
import { Input } from "@/components/ui/input";
import { TestQuestion } from "@/utils/constants";
import { useTranslations } from "next-intl";
import { useState } from "react";

// Question types as written in the test spreadsheet template.
const SINGLE_CHOICE = "Один из списка";
const SINGLE_CHOICE_WITH_OTHER = "Один из списка + свой ответ";

type Properties = {
  question: TestQuestion;
  position: number;
  total: number;
  initialChoiceId?: number;
  onAnswer: (choiceId: number) => void;
  onBack?: () => void;
};

export function TestQuestionCard({ question, position, total, initialChoiceId, onAnswer, onBack }: Properties) {
  const t = useTranslations("runner");
  const [choiceId, setChoiceId] = useState<number | undefined>(initialChoiceId);
  const [otherValue, setOtherValue] = useState("");
  // Free-text answers are recorded as one extra choice after the listed ones.
  const otherChoiceId = question.choices.length + 1;

  return (
    <QuestionStep
      position={position}
      total={total}
      title={question.text}
      canContinue={choiceId !== undefined}
      onNext={() => choiceId !== undefined && onAnswer(choiceId)}
      onBack={onBack}
    >
      {(question.type === SINGLE_CHOICE || question.type === SINGLE_CHOICE_WITH_OTHER) && (
        <ChoiceList choices={question.choices} value={choiceId} onChange={setChoiceId} />
      )}

      {question.type === SINGLE_CHOICE_WITH_OTHER && (
        <Input
          className="h-12 rounded-xl"
          value={otherValue}
          onFocus={() => setChoiceId(otherChoiceId)}
          onChange={(event) => setOtherValue(event.target.value)}
          placeholder={t("answerPlaceholder")}
        />
      )}
    </QuestionStep>
  );
}
