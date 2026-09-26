import { cn } from "@/utils/utils";

const STENS = Array.from({ length: 10 }, (_, index) => index + 1);
// Stens 4–7 are the average band.
const AVERAGE_FROM = 4;
const AVERAGE_TO = 7;

// A score on the ten-point sten scale as ten cells: the average band shaded, the person's sten
// filled, and an optional comparison (a team's mean) underlined in the team series colour.
export function StenScale({
  value,
  comparison,
  label,
  className,
}: {
  value: number;
  comparison?: number | null;
  label: string;
  className?: string;
}) {
  const sten = Math.min(10, Math.max(1, Math.round(value)));
  const compared = comparison == null ? null : Math.min(10, Math.max(1, Math.round(comparison)));

  return (
    <div role="img" aria-label={label} className={cn("grid grid-cols-10 gap-0.5", className)}>
      {STENS.map((step) => (
        <span
          key={step}
          className={cn(
            "h-4 border transition-colors print:border-gray-400",
            step === sten
              ? "border-primary bg-primary print:bg-gray-800"
              : step >= AVERAGE_FROM && step <= AVERAGE_TO
                ? "border-primary/15 bg-accent print:bg-gray-200"
                : "bg-muted",
            step === compared && "shadow-[inset_0_-3px_0_var(--series-2)]",
          )}
        />
      ))}
    </div>
  );
}

// The numbers under a StenScale, aligned to its cells.
export function StenAxis({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("grid grid-cols-10 gap-0.5 text-center font-mono text-[0.625rem] text-muted-foreground", className)}>
      {STENS.map((step) => (
        <span key={step}>{step}</span>
      ))}
    </div>
  );
}
