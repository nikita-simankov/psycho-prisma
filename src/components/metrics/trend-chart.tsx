import type { ScaleTrend } from "@/utils/metrics";
import { cn } from "@/utils/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";
import { ChartPanel } from "./chart-panel";

const RANGE = { sten: { min: 1, max: 10, averageFrom: 4, averageTo: 7 }, t: { min: 20, max: 80, averageFrom: 40, averageTo: 60 } } as const;

// One small line chart per scale, on a shared scale range so they read side by side.
export function TrendCharts({ trends }: { trends: ScaleTrend[] }) {
  const t = useTranslations("metrics");
  const chart = useTranslations("profileChart");
  const format = useFormatter();
  const shown = trends.filter((trend) => trend.points.length > 1);

  if (shown.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("oneResult")}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {shown.map((trend) => {
        const range = RANGE[trend.kind];
        const x = (index: number) => (trend.points.length === 1 ? 50 : 4 + (index / (trend.points.length - 1)) * 92);
        const y = (value: number) => 100 - ((Math.min(range.max, Math.max(range.min, value)) - range.min) / (range.max - range.min)) * 100;
        const latest = trend.points[trend.points.length - 1];
        const change = trend.change;

        return (
          <ChartPanel
            key={trend.scaleId}
            title={trend.scaleName}
            aside={
              <>
                <span>{latest.value}</span>
                {change && change.delta !== 0 && (
                  <span
                    className={cn(
                      "flex items-center text-xs tabular-nums",
                      change.reliable ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                    title={change.reliable ? t("reliable", { rci: change.rci }) : t("withinError", { rci: change.rci })}
                  >
                    {change.delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
                    {change.delta > 0 ? `+${change.delta}` : change.delta}
                  </span>
                )}
              </>
            }
          >
            <div className="relative h-16">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                <rect x="0" width="100" y={y(range.averageTo)} height={y(range.averageFrom) - y(range.averageTo)} className="fill-muted" />
                <polyline
                  points={trend.points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ")}
                  fill="none"
                  stroke="var(--series-1)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {trend.points.map((point, index) => (
                <ChartTip
                  key={index}
                  label={`${format.dateTime(point.date, { dateStyle: "medium" })}\n${chart(`kind.${trend.kind}`)} ${point.value}`}
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-series-1 outline-hidden ring-2 ring-card before:absolute before:-inset-2 before:content-[''] focus-visible:ring-ring"
                  style={{ left: `${x(index)}%`, top: `${y(point.value)}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{format.dateTime(trend.points[0].date, { month: "short", year: "numeric" })}</span>
              <span>{format.dateTime(latest.date, { month: "short", year: "numeric" })}</span>
            </div>
            {change?.reliable && <p className="text-xs text-muted-foreground">{t(change.direction === "up" ? "reliableUp" : "reliableDown")}</p>}
          </ChartPanel>
        );
      })}
    </div>
  );
}
