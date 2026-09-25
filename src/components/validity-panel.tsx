import type { Validity } from "@/utils/validity";
import { cn } from "@/utils/utils";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useTranslations } from "next-intl";

const STATUS = {
  reliable: { icon: ShieldCheck, tone: "border-success/30 bg-success/5", iconTone: "text-success" },
  questionable: { icon: ShieldAlert, tone: "border-warning/40 bg-warning/10", iconTone: "text-warning" },
  unknown: { icon: ShieldQuestion, tone: "border-border bg-muted/50", iconTone: "text-muted-foreground" },
} as const;

// How far a submission's answers can be trusted, from its lie and other validity scales.
export function ValidityPanel({ validity, className }: { validity: Validity; className?: string }) {
  const t = useTranslations("validity");
  const { icon: Icon, tone, iconTone } = STATUS[validity.status];

  return (
    <section
      aria-label={t("title")}
      className={cn("break-inside-avoid rounded-lg border p-3 text-sm", tone, className)}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconTone)} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-medium">{t(`status.${validity.status}`)}</p>
          <ul className="flex flex-col gap-0.5 text-muted-foreground">
            {validity.checks.map((check) => (
              <li key={check.scaleId} className="flex flex-wrap items-baseline gap-x-2">
                <span className={cn(check.status === "high" && "font-medium text-foreground")}>{check.scaleName}</span>
                <span className="tabular-nums">
                  {check.value === null
                    ? t("noScore")
                    : check.max === null
                      ? t(`value.${check.measure}`, { value: check.value })
                      : t(`valueWithLimit.${check.measure}`, { value: check.value, max: check.max })}
                </span>
                {check.status === "high" && <span className="text-warning">{t("aboveLimit")}</span>}
                {check.status === "unset" && check.value !== null && <span>{t("noLimit")}</span>}
                {check.summary && <p className="basis-full whitespace-pre-line text-xs">{check.summary}</p>}
              </li>
            ))}
          </ul>
          {validity.status === "questionable" && <p className="text-muted-foreground">{t("advice")}</p>}
        </div>
      </div>
    </section>
  );
}
