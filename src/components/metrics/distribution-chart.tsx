import type { Distribution } from "@/utils/analytics";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";

const AVERAGE = { sten: [4, 7], t: [40, 59] } as const;

// Small column charts, one per scale: how many people's latest score falls in each band.
export function DistributionCharts({ scales }: { scales: Distribution[] }) {
  const t = useTranslations("analytics");
  const chart = useTranslations("profileChart");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {scales.map((scale) => {
        const max = Math.max(1, ...scale.bins.map((bin) => bin.count));
        const [averageFrom, averageTo] = AVERAGE[scale.kind];
        return (
          <figure key={scale.scaleId} className="flex flex-col gap-2 rounded-lg border p-3">
            <figcaption className="flex items-start justify-between gap-2 text-sm">
              <span className="leading-snug">{scale.scaleName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{t("people", { count: scale.people })}</span>
            </figcaption>
            <div className="flex h-20 items-end gap-0.5">
              {scale.bins.map((bin) => (
                <div
                  key={bin.label}
                  className={cn(
                    "flex h-full flex-1 items-end rounded-sm",
                    bin.from >= averageFrom && bin.from <= averageTo && "bg-muted"
                  )}
                >
                  <ChartTip
                    label={`${scale.scaleName}\n${chart(`kind.${scale.kind}`)} ${bin.label}: ${t("people", { count: bin.count })}`}
                    className="relative block w-full rounded-t-[4px] bg-series-1 outline-hidden before:absolute before:-top-4 before:inset-x-0 before:h-4 before:content-[''] focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ height: bin.count === 0 ? 0 : `${Math.max(4, (bin.count / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-0.5 text-center text-[10px] tabular-nums text-muted-foreground">
              {scale.bins.map((bin) => (
                <span key={bin.label} className="flex-1 truncate">
                  {bin.label}
                </span>
              ))}
            </div>
          </figure>
        );
      })}
    </div>
  );
}
