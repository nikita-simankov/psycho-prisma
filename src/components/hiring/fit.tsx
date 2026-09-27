import { Badge } from "@/components/ui/badge";
import type { ProfileFit } from "@/utils/target-profiles";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";

const LEVEL_VARIANT = { strong: "success", partial: "warning", weak: "outline", none: "outline" } as const;

// How many targeted scales fall inside the profile's range, for lists and column heads.
export function FitBadge({ fit, className }: { fit: ProfileFit; className?: string }) {
  const t = useTranslations("hiring.fit");
  if (fit.level === "none") return null;
  return (
    <Badge data-fit={fit.level} variant={LEVEL_VARIANT[fit.level]} className={cn("normal-case", className)}>
      {t("short", { inside: fit.inside, total: fit.total })}
    </Badge>
  );
}

// A result read against a target profile: the count inside the range, then each scale's place.
export function FitSummary({ fit, profileName }: { fit: ProfileFit; profileName: string }) {
  const t = useTranslations("hiring.fit");

  return (
    <section aria-labelledby="fit-title" className="flex flex-col gap-3 rounded-lg border bg-card p-4 break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="fit-title" className="font-medium">
          {t("title", { profile: profileName })}
        </h3>
        <FitBadge fit={fit} />
      </div>
      {fit.level === "none" ? (
        <p className="text-sm text-muted-foreground">{t("nothing")}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t(`level.${fit.level}`, { inside: fit.inside, total: fit.total })}</p>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {fit.scales.map((scale) => (
              <li key={scale.scaleId} className="flex justify-between gap-3 border-b border-dashed py-1 last:border-0">
                <span>{scale.scaleName}</span>
                <span className={cn("shrink-0 text-right", scale.status === "inside" ? "text-success" : scale.status === "missing" ? "text-muted-foreground" : "font-medium")}>
                  {t(`status.${scale.status}`, { from: scale.band.min, to: scale.band.max })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
