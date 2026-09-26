import type { BalanceGroup } from "@/utils/analytics";
import type { Band } from "@/utils/norms";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";
import { PrivacyMask } from "./privacy-mask";

const BANDS: Band[] = ["low", "average", "high"];
// Low and high in the two series colours either side of a neutral middle.
const FILL: Record<Band, string> = { low: "bg-series-2", average: "bg-muted-foreground/30", high: "bg-series-1" };

// Each group's spread across the scales: for every scale, one bar split into how many people
// score low, average and high, counts printed beside it. Small multiples, one per group, so a
// team that leans one way on a scale stands out against the organization.
export function BalanceMap({ groups, everyoneLabel }: { groups: BalanceGroup[]; everyoneLabel: string }) {
  const t = useTranslations("analytics.balance");
  const band = useTranslations("profileChart.band");
  const people = useTranslations("analytics");

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <figure className="flex flex-col gap-3" data-balance-map>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
        {BANDS.map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 rounded-[2px]", FILL[key])} />
            {band(key)}
          </li>
        ))}
      </ul>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const label = group.teamName ?? everyoneLabel;
          return (
            <section key={group.key} className="flex flex-col gap-2.5 rounded-lg border bg-card p-4 break-inside-avoid" aria-label={label}>
              <header className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-medium">{label}</h3>
                {!group.hidden && <span className="font-mono text-xs text-muted-foreground">{people("people", { count: group.people })}</span>}
              </header>
              {group.hidden ? (
                <PrivacyMask label={label} />
              ) : group.scales.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noScales")}</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {group.scales.map((scale) => (
                    <li key={scale.scaleId} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-2 text-xs">
                      <span className="truncate" title={scale.scaleName}>
                        {scale.scaleName}
                      </span>
                      <ChartTip
                        label={`${label} · ${scale.scaleName}\n${BANDS.map((key) => `${band(key)}: ${scale[key]}`).join(", ")}`}
                        className="flex h-2.5 overflow-hidden rounded-[2px] outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {BANDS.map((key) =>
                          scale[key] ? <span key={key} className={FILL[key]} style={{ width: `${(scale[key] / scale.total) * 100}%` }} /> : null
                        )}
                      </ChartTip>
                      <span className="font-mono tabular-nums text-muted-foreground" aria-hidden>
                        {scale.low}·{scale.average}·{scale.high}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <figcaption className="text-xs text-muted-foreground">{t("caption")}</figcaption>
    </figure>
  );
}
