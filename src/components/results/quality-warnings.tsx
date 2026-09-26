import type { QualityWarning } from "@/utils/answer-quality";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

// Answer patterns that make the scores less trustworthy.
export function QualityWarnings({ warnings }: { warnings: QualityWarning[] }) {
  const t = useTranslations("quality");

  if (warnings.length === 0) return null;

  return (
    <section aria-label={t("title")} className="break-inside-avoid rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="font-medium">{t("title")}</p>
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
        </div>
      </div>
    </section>
  );
}
