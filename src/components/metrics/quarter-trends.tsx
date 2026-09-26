import type { QuarterSeries } from "@/utils/analytics";
import { useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";

const RANGE = { sten: { min: 1, max: 10, averageFrom: 4, averageTo: 7 }, t: { min: 20, max: 80, averageFrom: 40, averageTo: 60 } } as const;

// Small multiples: each scale's average per quarter on its own norm range, with the average band shaded.
export function QuarterTrends({ series }: { series: QuarterSeries[] }) {
  const t = useTranslations("analytics");
  const chart = useTranslations("profileChart");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {series.map((scale) => {
        const range = RANGE[scale.kind];
        const count = scale.points.length;
        const x = (index: number) => (count === 1 ? 50 : 6 + (index / (count - 1)) * 88);
        const y = (value: number) => 100 - ((Math.min(range.max, Math.max(range.min, value)) - range.min) / (range.max - range.min)) * 100;
        const quarter = (point: QuarterSeries["points"][number]) => t("quarter", { quarter: point.quarter, year: point.year });
        const last = scale.points[count - 1];

        return (
          <figure key={scale.scaleId} className="flex flex-col gap-2 rounded-lg border p-3">
            <figcaption className="flex items-start justify-between gap-2 text-sm">
              <span className="leading-snug">{scale.scaleName}</span>
              <span className="font-heading font-semibold tabular-nums">{last.average}</span>
            </figcaption>
            <div className="relative h-16">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                <rect x="0" width="100" y={y(range.averageTo)} height={y(range.averageFrom) - y(range.averageTo)} className="fill-muted" />
                {count > 1 && (
                  <polyline
                    points={scale.points.map((point, index) => `${x(index)},${y(point.average)}`).join(" ")}
                    fill="none"
                    stroke="var(--series-1)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
              {scale.points.map((point, index) => (
                <ChartTip
                  key={point.key}
                  label={`${quarter(point)}\n${chart(`kind.${scale.kind}`)} ${point.average} · ${t("people", { count: point.people })}`}
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-series-1 outline-none ring-2 ring-card before:absolute before:-inset-2 before:content-[''] focus-visible:ring-ring"
                  style={{ left: `${x(index)}%`, top: `${y(point.average)}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{quarter(scale.points[0])}</span>
              {count > 1 && <span>{quarter(last)}</span>}
            </div>
          </figure>
        );
      })}
    </div>
  );
}
