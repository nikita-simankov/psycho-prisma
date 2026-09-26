import { MIN_NORM_SAMPLE, hasOrgNorms, type NormSource, type OrgNorms } from "@/utils/norms";
import { cn } from "@/utils/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";

// Switch between the published norms and the organization's own, as two links so the choice
// lives in the address. The own-norms option stays disabled, with the reason, until enough
// people have taken the test.
export function NormsToggle({
  current,
  norms,
  hrefs,
  className,
}: {
  current: NormSource;
  norms: OrgNorms | null;
  hrefs: Record<NormSource, string>;
  className?: string;
}) {
  const t = useTranslations("norms");
  const available = hasOrgNorms(norms);
  const people = norms?.people ?? 0;
  const option = "rounded-[4px] px-2.5 py-1 text-xs font-medium transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("flex flex-col gap-1.5 print:hidden", className)} data-norms-toggle>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("label")}</span>
        <nav aria-label={t("label")} className="inline-flex gap-0.5 rounded-md border bg-card p-0.5">
          {(["published", "org"] as const).map((source) =>
            source === "org" && !available ? (
              <span key={source} aria-disabled className={cn(option, "cursor-not-allowed text-muted-foreground/70")}>
                {t(source)}
              </span>
            ) : (
              <Link
                key={source}
                href={hrefs[source]}
                scroll={false}
                aria-current={current === source ? "true" : undefined}
                className={cn(option, current === source ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                {t(source)}
              </Link>
            )
          )}
        </nav>
      </div>
      <p className="text-xs text-muted-foreground">
        {!available
          ? people >= MIN_NORM_SAMPLE
            ? t("noSpread")
            : t("notEnough", { count: people, min: MIN_NORM_SAMPLE })
          : current === "org"
            ? t("orgNote", { count: people })
            : t("publishedNote")}
      </p>
    </div>
  );
}
