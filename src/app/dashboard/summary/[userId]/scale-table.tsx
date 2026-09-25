import type { ScaleRow } from "@/utils/scoring";
import { useTranslations } from "next-intl";

export default function ScaleTable({ rows }: Readonly<{ rows: ScaleRow[] }>) {
  const t = useTranslations("scores");
  const table = useTranslations("results.table");
  const hasCorrected = rows.some((row) => row.correctedGrade !== null);
  const hasTGrade = rows.some((row) => row.tGrade !== null);
  const hasStan = rows.some((row) => row.stan !== null);

  return (
    <div className="overflow-x-auto">
      <table className="border w-full text-sm">
        <thead>
          <tr className="text-center">
            <th className="border p-1">{table("number")}</th>
            <th className="border p-1">{t("scale")}</th>
            <th className="border p-1">{t("raw")}</th>
            {hasCorrected && <th className="border p-1">{t("corrected")}</th>}
            {hasTGrade && <th className="border p-1">{t("tScore")}</th>}
            {hasStan && <th className="border p-1">{t("sten")}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.scaleId} className="text-center">
              <td className="border p-1">{row.scaleId}</td>
              <td className="border p-1 text-left">{row.scaleName}</td>
              <td className="border p-1">{row.rawGrade}</td>
              {hasCorrected && <td className="border p-1">{row.correctedGrade}</td>}
              {hasTGrade && <td className="border p-1">{row.tGrade}</td>}
              {hasStan && <td className="border p-1">{row.stan}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
