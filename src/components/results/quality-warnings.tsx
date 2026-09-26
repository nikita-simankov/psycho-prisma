import type { QualityScore, QualityWarning } from "@/utils/answer-quality";
import { cn } from "@/utils/utils";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const TONE = {
  good: { box: "border-border bg-card", icon: "text-success", bar: "bg-success" },
  fair: { box: "border-warning/40 bg-warning/10", icon: "text-warning", bar: "bg-warning" },
  poor: { box: "border-destructive/40 bg-destructive/5", icon: "text-destructive", bar: "bg-destructive" },
} as const;

// How far the answers can be trusted: one 0–100 answer-quality score with a short explanation,
// then the answer patterns that took points off.
export function QualityWarnings({ warnings, quality }: { warnings: QualityWarning[]; quality?: QualityScore }) {
  const t = useTranslations("quality");

  if (!quality && warnings.length === 0) return null;
  const band = quality?.band ?? "fair";
  const tone = TONE[band];
  const Icon = band === "good" ? ShieldCheck : AlertTriangle;

  return (
    <section aria-label={t("scoreTitle")} data-quality-score={quality?.score} className={cn("break-inside-avoid rounded-lg border p-3 text-sm", tone.box)}>
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.icon)} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {quality && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-medium">
                {t("scoreTitle")}: <span className="font-mono tabular-nums">{t("score", { score: quality.score })}</span>
                <span className="text-muted-foreground"> · {t(`band.${band}`)}</span>
              </p>
              <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <span className={cn("block h-full", tone.bar)} style={{ width: `${quality.score}%` }} />
              </span>
            </div>
          )}
          <p className="text-muted-foreground">{warnings.length ? t("title") : t("clean")}</p>
          {warnings.length > 0 && (
            <ul className="flex list-disc flex-col gap-0.5 pl-4 text-muted-foreground">
              {warnings.map((warning) => (
                <li key={warning.kind}>
                  {warning.kind === "sameAnswer" && t("sameAnswer", { share: warning.share })}
                  {warning.kind === "tooFast" && t("tooFast", { seconds: warning.secondsPerAnswer })}
                  {warning.kind === "missing" && t("missing", { count: warning.count })}
                  {warning.kind === "language" && t("language", { language: t(`languages.${warning.locale === "en" ? "en" : "other"}`) })}
                </li>
              ))}
            </ul>
          )}
          {quality && <p className="text-xs text-muted-foreground">{t("scoreHint")}</p>}
        </div>
      </div>
    </section>
  );
}
