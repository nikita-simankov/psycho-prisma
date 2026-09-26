import { ScaleInfoButton } from "@/components/results/scale-info";
import type { ScaleTrend } from "@/utils/metrics";
import type { ScaleInfo } from "@/utils/results";
import { cn } from "@/utils/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";

const RANGE = { sten: { min: 1, max: 10, averageFrom: 4, averageTo: 7 }, t: { min: 20, max: 80, averageFrom: 40, averageTo: 60 } } as const;

// The previous and the latest profile on one set of tracks: a hollow ring for before, a filled dot
// for now, joined by a line. Each scale says whether the move is a reliable change or within
// measurement error, so small wobbles aren't read as development.
export function ProfileOverlay({ trends, info }: { trends: ScaleTrend[]; info?: Record<number, ScaleInfo> }) {
  const t = useTranslations("metrics");
  const chart = useTranslations("profileChart");
  const format = useFormatter();
  const shown = trends.filter((trend) => trend.points.length > 1 && trend.change);
  if (shown.length === 0) return null;

  const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
  const before = shown[0].points[shown[0].points.length - 2].date;
  const after = shown[0].points[shown[0].points.length - 1].date;
  const assumed = shown.some((trend) => trend.assumed);

  return (
    <figure className="flex flex-col gap-3" data-profile-overlay>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full border-2 border-series-2 bg-card" />
          {t("overlay.before", { date: date(before) })}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-series-1" />
          {t("overlay.after", { date: date(after) })}
        </li>
      </ul>
      <div className="flex flex-col divide-y rounded-lg border bg-card">
        {shown.map((trend) => {
          const range = RANGE[trend.kind];
          const change = trend.change!;
          const [previous, latest] = trend.points.slice(-2);
          const percent = (value: number) => ((Math.min(range.max, Math.max(range.min, value)) - range.min) / (range.max - range.min)) * 100;
          const from = Math.min(percent(previous.value), percent(latest.value));
          const to = Math.max(percent(previous.value), percent(latest.value));
          const verdict = change.direction === "up" ? t("overlay.up") : change.direction === "down" ? t("overlay.down") : t("overlay.none");
          const Icon = change.direction === "up" ? ArrowUpRight : change.direction === "down" ? ArrowDownRight : Minus;

          return (
            <div
              key={trend.scaleId}
              className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_9.5rem]"
            >
              <span className="flex items-start gap-1 text-sm leading-snug">
                {trend.scaleName}
                <ScaleInfoButton name={trend.scaleName} info={info?.[trend.scaleId]} kind={trend.kind} />
              </span>
              <div className="relative h-6">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-muted" />
                <div
                  className="absolute top-1/2 h-3 -translate-y-1/2 border border-primary/15 bg-accent"
                  style={{ left: `${percent(range.averageFrom)}%`, width: `${percent(range.averageTo) - percent(range.averageFrom)}%` }}
                />
                <div
                  aria-hidden
                  className={cn("absolute top-1/2 h-0.5 -translate-y-1/2", change.reliable ? "bg-foreground" : "bg-muted-foreground/50")}
                  style={{ left: `${from}%`, width: `${to - from}%` }}
                />
                <ChartTip
                  label={`${trend.scaleName}\n${date(previous.date)}: ${chart(`kind.${trend.kind}`)} ${previous.value}`}
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-series-2 bg-card outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ left: `${percent(previous.value)}%` }}
                />
                <ChartTip
                  label={`${trend.scaleName}\n${date(latest.date)}: ${chart(`kind.${trend.kind}`)} ${latest.value}`}
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-series-1 outline-hidden ring-2 ring-card focus-visible:ring-ring"
                  style={{ left: `${percent(latest.value)}%` }}
                />
              </div>
              <span
                className={cn("flex items-center gap-1 text-xs sm:justify-end", change.reliable ? "font-medium text-foreground" : "text-muted-foreground")}
                title={change.reliable ? t("reliable", { rci: change.rci }) : t("withinError", { rci: change.rci })}
              >
                <span className="font-mono tabular-nums">
                  {previous.value} → {latest.value}
                </span>
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span data-change={change.direction}>{verdict}</span>
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {t("overlay.caption")} {assumed && t("overlay.assumed", { alpha: shown.find((trend) => trend.assumed)!.reliability })}
      </figcaption>
    </figure>
  );
}
