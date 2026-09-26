import { normPosition } from "@/utils/norms";
import type { ScaleRow } from "@/utils/scoring";
import { StenScale } from "@/components/ui/sten-scale";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

// Each scale's score on its norm scale, with the average band shaded: stens as ten cells, T-scores
// on a continuous track. Scales without norms show their raw score only.
export function ScaleProfile({ rows }: { rows: ScaleRow[] }) {
  const t = useTranslations("profileChart");
  const positioned = rows.map((row) => ({ row, position: normPosition(row) }));
  const kinds = Array.from(new Set(positioned.flatMap((entry) => (entry.position ? [entry.position.kind] : []))));

  return (
    <figure className="flex flex-col gap-2 break-inside-avoid">
      <div className="flex flex-col divide-y rounded-lg border bg-card">
        {positioned.map(({ row, position }) => {
          const percent = (value: number) =>
            position ? ((value - position.min) / (position.max - position.min)) * 100 : 0;

          return (
            <div key={row.scaleId} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_5.5rem]">
              <span className="text-sm leading-snug">{row.scaleName}</span>
              {position ? (
                <>
                  {position.kind === "sten" ? (
                    <StenScale
                      value={position.value}
                      label={t("aria", {
                        scale: row.scaleName,
                        kind: t(`kind.${position.kind}`),
                        value: position.value,
                        band: t(`band.${position.band}`),
                      })}
                    />
                  ) : (
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
                      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-muted" />
                      <div
                        className="absolute top-1/2 h-4 -translate-y-1/2 border border-primary/15 bg-accent print:bg-gray-200"
                        style={{ left: `${percent(position.averageFrom)}%`, width: `${percent(position.averageTo) - percent(position.averageFrom)}%` }}
                      />
                      <div
                        className="absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 bg-primary print:bg-gray-800"
                        style={{ left: `${percent(position.value)}%` }}
                      />
                    </div>
                  )}
                  <span className="flex items-baseline gap-1.5 text-sm sm:justify-end">
                    <span className="font-mono font-medium tabular-nums">{position.value}</span>
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
