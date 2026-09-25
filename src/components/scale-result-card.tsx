import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{row.scaleName}</CardTitle>
        <CardDescription className="flex flex-wrap gap-x-4">
          {values.map((item) => (
            <span key={item.label}>
              {item.label}: <span className="font-semibold text-foreground">{item.value}</span>
            </span>
          ))}
        </CardDescription>
      </CardHeader>
      {row.summary && <CardContent>{row.summary}</CardContent>}
    </Card>
  );
}
