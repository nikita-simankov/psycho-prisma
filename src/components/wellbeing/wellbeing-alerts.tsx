import { Badge } from "@/components/ui/badge";
import type { Context } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { MIN_GROUP } from "@/utils/results";
import { can } from "@/utils/roles";
import { ruleLabel } from "@/utils/wellbeing-scores";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ResolveButton } from "./resolve-button";

// Open early warnings: a team's wellbeing average past the level the organization set, or sharply
// worse than in the previous round, each with next steps. Alerts on clinical screens are shown
// only to roles with viewSensitive. Renders nothing for roles without viewWellbeing, and, when
// `quiet`, nothing when there are no alerts.
export async function WellbeingAlerts({ context, quiet = false }: { context: Context; quiet?: boolean }) {
  const { organization, membership } = context;
  if (!can(membership.role, "viewWellbeing")) return null;

  const alerts = await prisma.wellbeingAlert.findMany({
    where: { organizationId: organization.id, resolvedAt: null, ...(!can(membership.role, "viewSensitive") && { sensitive: false }) },
    include: { team: { select: { name: true } }, round: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  if (quiet && !alerts.length) return null;

  const t = await getTranslations("wellbeing.alerts");
  const format = await getFormatter();
  const locale = await getLocale();
  const base = await organizationBase();
  const tests = await prisma.test.findMany({ where: { id: { in: alerts.map((alert) => alert.testId) } } });
  const number = (value: number) => format.number(value, { maximumFractionDigits: 1 });

  if (!alerts.length) {
    return <p className="text-sm text-muted-foreground">{t("none", { min: MIN_GROUP })}</p>;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label={t("title")}>
      {alerts.map((alert) => {
        const label = ruleLabel(alert, tests, locale);
        const Icon = alert.kind === "drop" ? TrendingDown : AlertTriangle;
        return (
          <li key={alert.id} className="flex flex-col gap-3 rounded-lg border border-l-2 border-l-warning bg-card p-4" data-alert={alert.kind}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-medium">
                    {t(alert.kind === "drop" ? "drop" : "threshold", { team: alert.team.name, label })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {alert.kind === "drop"
                      ? t("dropDetail", { value: number(alert.value), previous: number(alert.previous ?? alert.value), people: alert.people })
                      : t("thresholdDetail", { value: number(alert.value), limit: number(alert.limit), people: alert.people })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Link href={`${base}/rounds/${alert.round.id}`} className="underline-offset-4 hover:underline">
                      {alert.round.name}
                    </Link>
                    {" · "}
                    {format.dateTime(alert.createdAt, { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alert.sensitive && <Badge variant="outline">{t("restricted")}</Badge>}
                <ResolveButton kind="alert" id={alert.id} label={t("resolve")} />
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stepsTitle")}</p>
              <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-5 text-sm">
                <li>{t(alert.kind === "drop" ? "steps.lookBack" : "steps.talk", { team: alert.team.name })}</li>
                <li>{t("steps.actions")}</li>
                <li>{t("steps.support")}</li>
                <li>{t("steps.pulse")}</li>
              </ol>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
