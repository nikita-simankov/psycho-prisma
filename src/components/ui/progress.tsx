import { cn } from "@/utils/utils";

// A plain progress bar; value and max are counts.
export function Progress({ value, max, className, label }: { value: number; max: number; className?: string; label?: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
    </div>
  );
}
