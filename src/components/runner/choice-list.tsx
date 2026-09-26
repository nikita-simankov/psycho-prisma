"use client";

import { cn } from "@/utils/utils";

type Choice = { id: number; text: string };

// Single-choice answers drawn as large, easy-to-tap rows; the number on each row is its key.
export function ChoiceList({
  choices,
  value,
  onChange,
  label,
}: {
  choices: Choice[];
  value: number | undefined;
  onChange: (choiceId: number) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {choices.map((choice, index) => {
        const selected = value === choice.id;

        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(choice.id)}
            className={cn(
              "group flex min-h-14 items-center gap-4 rounded-md border bg-card px-4 py-3 text-left transition-[background-color,border-color,box-shadow] duration-150 ease-calm hover:border-foreground/30 active:translate-y-px",
              selected && "border-primary bg-accent text-accent-foreground shadow-[inset_3px_0_0_var(--primary)] hover:border-primary",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-sm border font-mono text-xs tabular-nums text-muted-foreground transition-colors",
                selected && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {index < 9 ? index + 1 : "·"}
            </span>
            <span className="flex-1 whitespace-pre-line text-base leading-snug">{choice.text.trim()}</span>
          </button>
        );
      })}
    </div>
  );
}
