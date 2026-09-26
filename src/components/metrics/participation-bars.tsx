import { MIN_GROUP } from "@/utils/results";
import { useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";

type Bar = { id: string; name: string; value: { done: number; total: number; percent: number } | null };

// Completed share per group as horizontal bars on a 0–100% axis.
export function ParticipationBars({ bars }: { bars: Bar[] }) {
  const t = useTranslations("analytics");

  if (bars.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noAssignments")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {bars.map((bar) => (
        <li key={bar.id} className="grid grid-cols-1 items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_6.5rem]">
          <span className="truncate text-sm" title={bar.name}>
            {bar.name}
          </span>
          {bar.value ? (
            <>
              <div className="relative h-3 rounded-full bg-muted">
                <ChartTip
                  label={`${bar.name}\n${t("completedOf", bar.value)}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-series-1 outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ width: `${Math.max(bar.value.percent, 1)}%` }}
                />
              </div>
              <span className="text-sm tabular-nums sm:text-right">
                <span className="font-semibold">{bar.value.percent}%</span>{" "}
                <span className="text-xs text-muted-foreground">
                  {bar.value.done}/{bar.value.total}
                </span>
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground sm:col-span-2">{t("tooFew", { min: MIN_GROUP })}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
