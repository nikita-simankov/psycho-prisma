import { normPosition } from "@/utils/norms";
import type { ScaleRow } from "@/utils/scoring";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

// Most scales a strip shows; longer profiles are cut, the full one is a click away.
const MAX_SCALES = 16;

// A result's profile at a glance, for lists: one thin bar per normed scale, its height the score,
// scales outside the average band in the primary colour.
export function ProfileStrip({ rows, className }: { rows: ScaleRow[]; className?: string }) {
  const t = useTranslations("profileChart");
  const positioned = rows.flatMap((row) => {
    const position = normPosition(row);
    return position ? [{ row, position }] : [];
  });
  if (positioned.length === 0) return null;
  const shown = positioned.slice(0, MAX_SCALES);

  return (
    <span
      role="img"
      data-profile-strip
      aria-label={t("strip", {
        scales: shown.map(({ row, position }) => `${row.scaleName} ${position.value} (${t(`band.${position.band}`)})`).join(", "),
      })}
      className={cn("inline-flex h-5 items-end gap-px", className)}
    >
      {shown.map(({ row, position }) => (
        <span key={row.scaleId} className="relative h-full w-1.5 bg-muted">
          <span
            className={cn("absolute inset-x-0 bottom-0", position.band === "average" ? "bg-muted-foreground/45" : "bg-primary")}
            style={{ height: `${Math.max(10, ((position.value - position.min) / (position.max - position.min)) * 100)}%` }}
          />
        </span>
      ))}
    </span>
  );
}
