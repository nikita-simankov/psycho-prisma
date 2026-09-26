import { cn } from "@/utils/utils";
import { Eyebrow } from "./eyebrow";

// One figure with its label and an optional note, for summary rows. Figures are set in the serif
// with tabular digits so a row of them lines up.
export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "neutral" | "positive" | "attention" | "negative";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Eyebrow>{label}</Eyebrow>
      <span
        data-numeric
        className={cn(
          "font-heading text-3xl font-medium leading-none tracking-tight",
          tone === "positive" && "text-success",
          tone === "attention" && "text-warning",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
