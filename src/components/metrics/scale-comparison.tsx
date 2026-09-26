import { normPosition } from "@/utils/norms";
import type { GroupAverage } from "@/utils/results";
import type { ScaleRow } from "@/utils/scoring";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";
import { SeriesMark, seriesShape, type Series } from "./series-mark";

type Group = { label: string; average: GroupAverage };

// A person's latest score on each normed scale beside their team's and the organization's
// averages, on the scale's own range with the average band shaded.
export function ScaleComparison({ rows, team, everyone }: { rows: ScaleRow[]; team: Group | null; everyone: Group | null }) {
  const t = useTranslations("metrics");
  const chart = useTranslations("profileChart");
  const groups = [
    ["team", team],
    ["everyone", everyone],
  ] as const;
  const averageOf = (group: Group | null, scaleId: number) =>
    group?.average.scales.find((scale) => scale.scaleId === scaleId && scale.kind !== "raw")?.average ?? null;

  const positioned = rows.flatMap((row) => {
    const position = normPosition(row);
    return position ? [{ row, position }] : [];
  });

  if (positioned.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noNormedScales")}</p>;
  }

  const legend: { series: Series; label: string }[] = [
    { series: "person", label: t("series.person") },
    ...groups.flatMap(([series, group]) => (group ? [{ series: series as Series, label: group.label }] : [])),
  ];

  return (
    <figure className="flex flex-col gap-3">
      {legend.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {legend.map((entry) => (
            <li key={entry.series} className="flex items-center gap-1.5">
              <SeriesMark series={entry.series} />
              {entry.label}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col divide-y rounded-lg border">
        {positioned.map(({ row, position }) => {
          const percent = (value: number) => ((Math.min(position.max, Math.max(position.min, value)) - position.min) / (position.max - position.min)) * 100;
          const marks: { series: Series; label: string; value: number }[] = [
            ...groups.flatMap(([series, group]) => {
              const value = averageOf(group, row.scaleId);
              return value !== null && group ? [{ series: series as Series, label: group.label, value }] : [];
            }),
            // The person's own mark last, so it sits on top.
            { series: "person", label: t("series.person"), value: position.value },
          ];

          return (
            <div key={row.scaleId} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
              <span className="text-sm leading-snug">{row.scaleName}</span>
              <div className="relative h-6">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
                <div
                  className="absolute top-1/2 h-3 -translate-y-1/2 rounded-sm bg-muted-foreground/20"
                  style={{ left: `${percent(position.averageFrom)}%`, width: `${percent(position.averageTo) - percent(position.averageFrom)}%` }}
                />
                {marks.map((mark) => (
                  <ChartTip
                    key={mark.series}
                    label={`${row.scaleName}\n${mark.label}: ${mark.value} (${chart(`kind.${position.kind}`)})`}
                    className={cn(
                      "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 outline-hidden ring-2 ring-card focus-visible:ring-ring",
                      mark.series === "person" ? "h-3.5 w-3.5" : "h-3 w-3",
                      seriesShape(mark.series)
                    )}
                    style={{ left: `${percent(mark.value)}%` }}
                  />
                ))}
              </div>
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:justify-end">
                {[marks[marks.length - 1], ...marks.slice(0, -1)].map((mark) => (
                    <span key={mark.series} className="flex items-center gap-1">
                      <SeriesMark series={mark.series} className="h-2 w-2" />
                      <span className={cn("tabular-nums", mark.series === "person" && "font-semibold text-foreground")}>{mark.value}</span>
                    </span>
                  ))}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
