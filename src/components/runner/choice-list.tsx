"use client";

import { cn } from "@/utils/utils";

type Choice = { id: number; text: string };

// Single-choice answers drawn as large, easy-to-tap rows.
export function ChoiceList({
  choices,
  value,
  onChange,
}: {
  choices: Choice[];
  value: number | undefined;
  onChange: (choiceId: number) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {choices.map((choice) => {
        const selected = value === choice.id;

        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(choice.id)}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50",
              selected && "border-primary bg-accent text-accent-foreground ring-1 ring-primary"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40",
                selected && "border-primary"
              )}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </span>
            <span className="whitespace-pre-line">{choice.text.trim()}</span>
          </button>
        );
      })}
    </div>
  );
}
