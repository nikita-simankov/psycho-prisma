import { DEFAULT_RELIABILITY, NORM_SD, standardError } from "@/utils/psychometrics";
import { cn } from "@/utils/utils";

const STENS = Array.from({ length: 10 }, (_, index) => index + 1);
// Stens 4–7 are the average band.
const AVERAGE_FROM = 4;
const AVERAGE_TO = 7;
// The error band when the caller doesn't know the scale's reliability.
const DEFAULT_SEM = standardError(NORM_SD.sten, DEFAULT_RELIABILITY);

// Where a sten sits along the ten cells, in percent of the width: each cell's centre is at step − 0.5.
const along = (sten: number) => ((Math.min(10.5, Math.max(0.5, sten)) - 0.5) / 10) * 100;

// A score on the ten-point sten scale as ten cells: the average band shaded, the person's sten
// filled, and an optional comparison (a team's mean) underlined in the team series colour.
// A thin bar beneath spans ± one standard error of measurement, the range the true score most
// likely falls in; pass sem={null} where the value isn't one person's score (a group mean).
export function StenScale({
  value,
  comparison,
  sem = DEFAULT_SEM,
  label,
  className,
}: {
  value: number;
  comparison?: number | null;
  // Standard error of measurement in stens.
  sem?: number | null;
  label: string;
  className?: string;
}) {
  const sten = Math.min(10, Math.max(1, Math.round(value)));
  const compared = comparison == null ? null : Math.min(10, Math.max(1, Math.round(comparison)));

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div role="img" aria-label={label} className="grid grid-cols-10 gap-0.5">
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
      {sem != null && sem > 0 && (
        <div aria-hidden className="relative h-1">
          <span
            data-sem-band
            className="absolute inset-y-0 rounded-full bg-primary/35 print:bg-gray-500"
            style={{ left: `${along(sten - sem)}%`, width: `${along(sten + sem) - along(sten - sem)}%` }}
          />
        </div>
      )}
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
