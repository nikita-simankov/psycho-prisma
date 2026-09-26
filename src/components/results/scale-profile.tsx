import { normPosition } from "@/utils/norms";
import type { ScaleRow } from "@/utils/scoring";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

const BAND_TONE = {
  low: "bg-sky-600 dark:bg-sky-400",
  average: "bg-primary",
  high: "bg-amber-600 dark:bg-amber-400",
} as const;

// Each scale's score on its norm scale, with the average band shaded. Scales without norms
// show their raw score only.
export function ScaleProfile({ rows }: { rows: ScaleRow[] }) {
  const t = useTranslations("profileChart");
  const positioned = rows.map((row) => ({ row, position: normPosition(row) }));
  const kinds = Array.from(new Set(positioned.flatMap((entry) => (entry.position ? [entry.position.kind] : []))));

  return (
    <figure className="flex flex-col gap-2 break-inside-avoid">
      <div className="flex flex-col divide-y rounded-lg border">
        {positioned.map(({ row, position }) => {
          const percent = (value: number) =>
            position ? ((value - position.min) / (position.max - position.min)) * 100 : 0;

          return (
            <div key={row.scaleId} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_5.5rem]">
              <span className="text-sm leading-snug">{row.scaleName}</span>
              {position ? (
                <>
                  <div
                    className="relative h-6"
                    role="img"
                    aria-label={t("aria", {
                      scale: row.scaleName,
                      kind: t(`kind.${position.kind}`),
                      value: position.value,
                      band: t(`band.${position.band}`),
                    })}
                  >
                    <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-sm bg-muted-foreground/20 print:bg-gray-200"
                      style={{ left: `${percent(position.averageFrom)}%`, width: `${percent(position.averageTo) - percent(position.averageFrom)}%` }}
                    />
                    <div
                      className={cn(
                        "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow print:border-white",
                        BAND_TONE[position.band]
                      )}
                      style={{ left: `${percent(position.value)}%` }}
                    />
                  </div>
                  <span className="flex items-baseline gap-1.5 text-sm sm:justify-end">
                    <span className="font-heading font-semibold tabular-nums">{position.value}</span>
                    <span className={cn("text-xs", position.band === "average" ? "text-muted-foreground" : "font-medium")}>
                      {t(`band.${position.band}`)}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">{t("noNorms")}</span>
                  <span className="text-sm tabular-nums sm:text-right">
                    {row.correctedGrade ?? row.rawGrade ?? "—"}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      {kinds.length > 0 && (
        <figcaption className="text-xs text-muted-foreground">
          {kinds.map((kind) => t(`legend.${kind}`)).join(" ")}
        </figcaption>
      )}
    </figure>
  );
}
