import { PrivacyMask } from "@/components/metrics/privacy-mask";
import type { GroupAverage, HiddenGroup } from "@/utils/results";
import { useFormatter, useTranslations } from "next-intl";

type Result = { testId: string; name: string; responses: number; groups: GroupAverage[]; hidden: HiddenGroup[] };

// Averages of an anonymous round per team and for everyone, one table per test. Groups with fewer
// than MIN_GROUP answers keep their row, masked, so a small team is never mistaken for a missing one.
export function PulseResults({ results, everyoneLabel }: { results: Result[]; everyoneLabel: string }) {
  const t = useTranslations("wellbeing.pulse");
  const format = useFormatter();

  return (
    <div className="flex flex-col gap-6">
      {results.map((result) => {
        const scales = Array.from(new Map(result.groups.flatMap((group) => group.scales.map((scale) => [scale.scaleId, scale.scaleName] as const))).entries());
        const rows = [
          ...result.groups.map((group) => ({ key: group.key, label: group.teamName ?? everyoneLabel, people: group.people, group })),
          ...result.hidden.map((group) => ({ key: group.key, label: group.teamName ?? everyoneLabel, people: group.people, group: null })),
        ];
        return (
          <figure key={result.testId} className="flex flex-col gap-2">
            <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{result.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{t("responses", { count: result.responses })}</span>
            </figcaption>
            {rows.length === 0 ? (
              <PrivacyMask />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="p-2 text-left font-medium text-muted-foreground">
                        {t("group")}
                      </th>
                      {scales.map(([scaleId, name]) => (
                        <th key={scaleId} scope="col" className="p-2 text-left text-xs font-medium text-muted-foreground">
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key} className="border-b last:border-0">
                        <th scope="row" className="whitespace-nowrap p-2 text-left font-medium">
                          {row.label}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">{row.people}</span>
                        </th>
                        {row.group ? (
                          scales.map(([scaleId]) => {
                            const cell = row.group!.scales.find((scale) => scale.scaleId === scaleId);
                            return (
                              <td key={scaleId} className="p-2 font-mono tabular-nums">
                                {cell ? format.number(cell.average, { maximumFractionDigits: 1 }) : <PrivacyMask variant="cell" label={row.label} />}
                              </td>
                            );
                          })
                        ) : (
                          <td colSpan={Math.max(1, scales.length)} className="p-2">
                            <PrivacyMask variant="cell" label={row.label} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </figure>
        );
      })}
    </div>
  );
}
