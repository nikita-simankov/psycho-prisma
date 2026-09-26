import { heatStep } from "@/utils/analytics";
import type { GroupAverage } from "@/utils/results";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import { ChartTip } from "./chart-tip";

const STEPS = [100, 200, 300, 400, 500, 600, 700] as const;

// Average score per group (rows) and scale (columns), shaded light to dark from the low to the
// high end of each scale. The value is printed in every cell, so colour is never the only cue.
export function Heatmap({ groups, everyoneLabel }: { groups: GroupAverage[]; everyoneLabel: string }) {
  const t = useTranslations("analytics");
  const chart = useTranslations("profileChart");
  const scales = Array.from(
    new Map(groups.flatMap((group) => group.scales.filter((scale) => scale.kind !== "raw").map((scale) => [scale.scaleId, scale] as const))).values()
  );

  if (scales.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noHeatmap")}</p>;
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-separate border-spacing-0.5 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card p-2 text-left font-medium text-muted-foreground">{t("group")}</th>
              {scales.map((scale) => (
                <th key={scale.scaleId} scope="col" className="min-w-16 max-w-28 p-2 text-left align-bottom text-xs font-medium leading-snug text-muted-foreground">
                  {scale.scaleName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const label = group.teamName ?? everyoneLabel;
              return (
                <tr key={group.key}>
                  <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-card p-2 text-left font-medium">
                    {label}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">{group.people}</span>
                  </th>
                  {scales.map((scale) => {
                    const cell = group.scales.find((entry) => entry.scaleId === scale.scaleId);
                    if (!cell || cell.kind === "raw") {
                      return (
                        <td key={scale.scaleId} className="p-2 text-center text-muted-foreground">
                          —
                        </td>
                      );
                    }
                    const step = heatStep(cell.kind, cell.average);
                    return (
                      <td key={scale.scaleId} className="p-0">
                        <ChartTip
                          label={`${label} · ${scale.scaleName}\n${chart(`kind.${cell.kind}`)} ${cell.average}`}
                          className={cn(
                            "block rounded-[4px] p-2 text-center tabular-nums outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                            step >= 5 ? "text-white" : "text-[#0b0b0b]"
                          )}
                          style={{ background: `var(--seq-${STEPS[step - 1]})` }}
                        >
                          {cell.average}
                        </ChartTip>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <figcaption className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{t("heatLow")}</span>
        <span className="flex overflow-hidden rounded-sm" aria-hidden>
          {STEPS.map((step) => (
            <span key={step} className="h-3 w-5" style={{ background: `var(--seq-${step})` }} />
          ))}
        </span>
        <span>{t("heatHigh")}</span>
      </figcaption>
    </figure>
  );
}
