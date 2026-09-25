import { Card } from "@/components/ui/card";
import type { ScaleRow } from "@/utils/scoring";
import { useTranslations } from "next-intl";

export function ScaleResultCard({ row }: { row: ScaleRow }) {
  const t = useTranslations("scores");
  const values = [
    { label: t("raw"), value: row.rawGrade },
    { label: t("corrected"), value: row.correctedGrade },
    { label: t("tScore"), value: row.tGrade },
    { label: t("sten"), value: row.stan },
  ].filter((item) => item.value !== null);

  return (
    <Card className="break-inside-avoid p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="font-heading text-base font-semibold">{row.scaleName}</h3>
        <dl className="flex shrink-0 gap-2">
          {values.map((item) => (
            <div key={item.label} className="min-w-16 rounded-lg bg-muted px-3 py-1.5 text-center">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</dt>
              <dd className="font-heading text-lg font-bold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {row.summary && (
        <p className="mt-3 whitespace-pre-line border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">
          {row.summary}
        </p>
      )}
    </Card>
  );
}
