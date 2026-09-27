import { normPosition } from "@/utils/norms";
import { DEFAULT_RELIABILITY, NORM_SD, standardError } from "@/utils/psychometrics";
import type { ScaleInfo } from "@/utils/results";
import type { ScaleRow } from "@/utils/scoring";
import { StenScale, TargetBracket } from "@/components/ui/sten-scale";
import { bandsByScale, type TargetBand } from "@/utils/target-profiles";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import { ScaleInfoButton } from "./scale-info";

// Each scale's score on its norm scale, with the average band shaded: stens as ten cells, T-scores
// on a continuous track, each with its error band. Scales without norms show their raw score only.
// Group averages pass errorBand={false}: the standard error describes one person's score.
// A target profile's ranges, when given, show as a bracket above each targeted scale.
export function ScaleProfile({
  rows,
  info,
  errorBand = true,
  targets,
}: {
  rows: ScaleRow[];
  info?: Record<number, ScaleInfo>;
  errorBand?: boolean;
  targets?: TargetBand[];
}) {
  const t = useTranslations("profileChart");
  const positioned = rows.map((row) => ({ row, position: normPosition(row) }));
  const bands = bandsByScale(targets);
  const kinds = Array.from(new Set(positioned.flatMap((entry) => (entry.position ? [entry.position.kind] : []))));

  return (
    <figure className="flex flex-col gap-2 break-inside-avoid">
      <div className="flex flex-col divide-y rounded-lg border bg-card">
        {positioned.map(({ row, position }) => {
          const percent = (value: number) =>
            position ? ((Math.min(position.max, Math.max(position.min, value)) - position.min) / (position.max - position.min)) * 100 : 0;
          const sem = position && errorBand ? standardError(NORM_SD[position.kind], info?.[row.scaleId]?.reliability ?? DEFAULT_RELIABILITY) : null;
          const round = (value: number) => Math.round(value * 10) / 10;
          const target = position ? bands.get(row.scaleId) ?? null : null;
          const label = position
            ? [
                t("aria", {
                  scale: row.scaleName,
                  kind: t(`kind.${position.kind}`),
                  value: position.value,
                  band: t(`band.${position.band}`),
                }),
                sem ? t("errorRange", { from: round(Math.max(position.min, position.value - sem)), to: round(Math.min(position.max, position.value + sem)) }) : "",
                target ? t("targetRange", { from: target.min, to: target.max }) : "",
              ]
                .filter(Boolean)
                .join(", ")
            : "";

          return (
            <div key={row.scaleId} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_5.5rem]">
              <span className="flex items-start gap-1 text-sm leading-snug">
                {row.scaleName}
                <ScaleInfoButton name={row.scaleName} info={info?.[row.scaleId]} kind={position?.kind ?? null} />
              </span>
              {position ? (
                <>
                  {position.kind === "sten" ? (
                    <StenScale value={position.value} sem={sem} target={target} label={label} />
                  ) : (
                    <div className="flex flex-col">
                      {target && <TargetBracket from={percent(target.min)} to={percent(target.max)} />}
                      <div className="relative h-6" role="img" aria-label={label}>
                        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-muted" />
                        <div
                          className="absolute top-1/2 h-4 -translate-y-1/2 border border-primary/15 bg-accent print:bg-gray-200"
                          style={{ left: `${percent(position.averageFrom)}%`, width: `${percent(position.averageTo) - percent(position.averageFrom)}%` }}
                        />
                        {sem && (
                          <div
                            data-sem-band
                            className="absolute bottom-0 h-1 rounded-full bg-primary/35 print:bg-gray-500"
                            style={{ left: `${percent(position.value - sem)}%`, width: `${percent(position.value + sem) - percent(position.value - sem)}%` }}
                          />
                        )}
                        <div
                          className="absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 bg-primary print:bg-gray-800"
                          style={{ left: `${percent(position.value)}%` }}
                        />
                      </div>
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
          {[...kinds.map((kind) => t(`legend.${kind}`)), errorBand ? t("legend.errorBand") : "", bands.size ? t("legend.target") : ""].filter(Boolean).join(" ")}
        </figcaption>
      )}
    </figure>
  );
}
