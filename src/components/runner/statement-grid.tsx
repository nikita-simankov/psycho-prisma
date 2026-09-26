"use client";

import { cn } from "@/utils/utils";

type Choice = { id: number; text: string };
type Statement = { id: number; text: string; number: number };

// A page of statements sharing one answer scale: a table on wider screens, cards on phones.
export function StatementGrid({
  statements,
  choices,
  answers,
  onAnswer,
}: {
  statements: Statement[];
  choices: Choice[];
  answers: Record<string, number | string>;
  onAnswer: (statementId: number, choiceId: number) => void;
}) {
  const columns = { gridTemplateColumns: `minmax(0,1fr) repeat(${choices.length}, minmax(4.5rem, 6rem))` };

  return (
    <div className="flex flex-col gap-3 sm:gap-0 sm:rounded-lg sm:border sm:bg-card">
      <div className="hidden items-end gap-2 border-b bg-muted px-4 py-2.5 text-center text-xs font-medium text-muted-foreground sm:grid" style={columns} aria-hidden>
        <span />
        {choices.map((choice, index) => (
          <span key={choice.id} className="leading-tight">
            {choice.text.trim()}
            <kbd className="mt-1 hidden font-mono text-[10px] opacity-70 lg:block">{index + 1}</kbd>
          </span>
        ))}
      </div>
      {statements.map((statement) => {
        const value = answers[statement.id];
        const labelId = `statement-${statement.id}`;

        return (
          <div
            key={statement.id}
            role="radiogroup"
            aria-labelledby={labelId}
            data-statement={statement.id}
            className={cn(
              "flex flex-col gap-3 rounded-lg border p-4 sm:grid sm:items-center sm:gap-2 sm:rounded-none sm:border-0 sm:border-b sm:px-4 sm:py-3 sm:last:border-b-0",
              value === undefined ? "bg-card" : "bg-card sm:bg-accent/40"
            )}
            style={columns}
          >
            <p id={labelId} className="leading-snug">
              <span className="mr-2 font-mono text-xs tabular-nums text-muted-foreground">{statement.number}</span>
              {statement.text.trim()}
            </p>
            <div className="flex flex-wrap gap-2 sm:contents">
              {choices.map((choice) => {
                const selected = value === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onAnswer(statement.id, choice.id)}
                    className={cn(
                      "flex min-h-11 flex-1 items-center justify-center rounded-md border bg-card px-3 text-sm transition-colors hover:border-foreground/40 sm:mx-auto sm:h-10 sm:w-10 sm:flex-none sm:rounded-full sm:px-0",
                      selected && "border-primary bg-primary text-primary-foreground hover:border-primary"
                    )}
                  >
                    <span className="sm:sr-only">{choice.text.trim()}</span>
                    <span aria-hidden className={cn("hidden h-3 w-3 rounded-full sm:block", selected ? "bg-primary-foreground" : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
