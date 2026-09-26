import { StenAxis, StenScale } from "@/components/ui/sten-scale";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getTranslations } from "next-intl/server";

const SCALES = [
  { key: "a", value: 8, team: 6 },
  { key: "b", value: 6, team: 6 },
  { key: "c", value: 3, team: 5 },
  { key: "d", value: 5, team: 4 },
] as const;

// The hero's specimen: an excerpt of a real report layout, drawn with the product's own components.
export async function ProfileFigure() {
  const t = await getTranslations("landing.figure");

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex flex-col gap-5 rounded-lg border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-4">
          <div className="flex flex-col gap-1">
            <Eyebrow>{t("label")}</Eyebrow>
            <p className="font-heading text-2xl font-medium">{t("person")}</p>
            <p className="text-sm text-muted-foreground">{t("role")}</p>
          </div>
          <p className="text-sm font-medium">{t("test")}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[minmax(0,11rem)_1fr_2rem] items-center gap-3">
            <span />
            <StenAxis />
            <span />
          </div>
          {SCALES.map((scale) => (
            <div key={scale.key} className="grid grid-cols-[minmax(0,11rem)_1fr_2rem] items-center gap-3 text-sm">
              <span className="truncate">{t(`scales.${scale.key}`)}</span>
              <StenScale value={scale.value} comparison={scale.team} label={`${t(`scales.${scale.key}`)}: ${t("sten", { value: scale.value })}`} />
              <span className="text-right font-mono" data-numeric>
                {scale.value}
              </span>
            </div>
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 bg-primary" aria-hidden />
            {t("person_legend")}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 border border-primary/15 bg-accent" aria-hidden />
            {t("band_legend")}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 shadow-[inset_0_-3px_0_var(--series-2)]" aria-hidden />
            {t("team_legend")}
          </li>
        </ul>
        <p className="border-l-2 border-primary/40 pl-3 font-heading text-sm italic text-muted-foreground">{t("note")}</p>
      </div>
      <figcaption className="text-xs text-muted-foreground">{t("caption")}</figcaption>
    </figure>
  );
}
