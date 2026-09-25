import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { parseItems, roundProgress } from "@/utils/rounds";
import { ChevronRight, Plus, Repeat, Send } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ScheduleControls } from "./schedule-controls";

export async function generateMetadata() {
  const t = await getTranslations("rounds");
  return { title: t("title") };
}

export default async function RoundsPage() {
  const { organization } = await ensureMember("manageRounds");
  const base = organizationBase();
  const t = await getTranslations("rounds");
  const format = await getFormatter();

  const [rounds, schedules] = await Promise.all([
    prisma.round.findMany({ where: { organizationId: organization.id }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.roundSchedule.findMany({ where: { organizationId: organization.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const progress = await roundProgress(rounds.map((round) => round.id));
  const open = rounds.filter((round) => !round.closedAt);
  const closed = rounds.filter((round) => round.closedAt);
  const now = new Date();

  const row = (round: (typeof rounds)[number]) => {
    const stats = progress.get(round.id) ?? { people: 0, completed: 0, started: 0, overdue: 0 };
    return (
      <li key={round.id}>
        <Link href={`${base}/rounds/${round.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{round.name}</span>
              <Badge variant="secondary">{t(`purposes.${round.purpose}` as "purposes.development")}</Badge>
              {round.scheduleId && (
                <Badge variant="outline" className="gap-1">
                  <Repeat className="h-3 w-3" />
                  {t("cycle", { cycle: round.cycle })}
                </Badge>
              )}
              {stats.overdue > 0 && <Badge variant="destructive">{t("overdueCount", { count: stats.overdue })}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{t("itemCount", { count: parseItems(round.items).length })}</span>
              <span>
                {round.dueAt
                  ? t(round.dueAt < now && !round.closedAt ? "wasDue" : "dueOn", {
                      date: format.dateTime(round.dueAt, { dateStyle: "medium" }),
                    })
                  : t("noDue")}
              </span>
              <span>{t("completedOf", { done: stats.completed, total: stats.people })}</span>
            </div>
            <Progress value={stats.completed} max={stats.people} className="max-w-sm" label={t("progressLabel")} />
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        className="mb-0"
        actions={
          <Button asChild>
            <Link href={`${base}/rounds/new`}>
              <Plus className="h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("open")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {open.length ? (
            <ul className="divide-y border-t">{open.map(row)}</ul>
          ) : (
            <EmptyState
              icon={Send}
              title={t("noneOpen")}
              description={t("noneOpenText")}
              action={
                <Button asChild variant="outline">
                  <Link href={`${base}/rounds/new`}>{t("new")}</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("recurring")}</CardTitle>
            <CardDescription>{t("recurringText")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <ul className="divide-y border-t">
              {schedules.map((schedule) => (
                <li key={schedule.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{schedule.name}</span>
                      <Badge variant="secondary">{t(`purposes.${schedule.purpose}` as "purposes.development")}</Badge>
                      {!schedule.active && <Badge variant="outline">{t("paused")}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t("every", { count: schedule.intervalMonths })}
                      {schedule.active &&
                        ` · ${t("nextRun", { date: format.dateTime(schedule.nextRunAt, { dateStyle: "medium" }) })}`}
                    </span>
                  </div>
                  <ScheduleControls id={schedule.id} active={schedule.active} name={schedule.name} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {closed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("closed")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <ul className="divide-y border-t">{closed.map(row)}</ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
