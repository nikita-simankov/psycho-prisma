import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { allowedSubmissionWhere } from "@/utils/library";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { roundProgress } from "@/utils/rounds";
import { formatFullName } from "@/utils/user";
import { ChevronRight, ClipboardCheck, Clock, Send } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

const LIMIT = 6;

// The staff home's to-do: results to review, people behind schedule and open rounds.
export async function DashboardWork() {
  const context = await ensureMember("viewDashboard");
  const { organization, membership } = context;
  const base = await organizationBase();
  const t = await getTranslations("dashboard.work");
  const format = await getFormatter();
  const now = new Date();
  const reviews = can(membership.role, "writeConclusions");
  const rounds = can(membership.role, "manageRounds");

  // People with a result newer than their conclusion, newest first.
  const waiting = reviews
    ? await (async () => {
        const [latest, summaries] = await Promise.all([
          prisma.testSubmission.groupBy({
            by: ["userId"],
            where: await allowedSubmissionWhere(context),
            _max: { createdAt: true },
          }),
          prisma.reportVersion.groupBy({
            by: ["userId"],
            where: { organizationId: organization.id },
            _max: { createdAt: true },
          }),
        ]);
        // Reviewed means a report version saved after the latest result.
        const reviewed = new Map(summaries.map((summary) => [summary.userId, summary._max.createdAt]));
        const pending = latest
          .filter((row) => row._max.createdAt && !(reviewed.get(row.userId)! >= row._max.createdAt))
          .sort((a, b) => b._max.createdAt!.getTime() - a._max.createdAt!.getTime());
        const users = await prisma.user.findMany({
          where: { id: { in: pending.slice(0, LIMIT).map((row) => row.userId) } },
          select: { id: true, name: true, lastName: true, middleName: true },
        });
        return {
          total: pending.length,
          rows: pending.slice(0, LIMIT).flatMap((row) => {
            const user = users.find((entry) => entry.id === row.userId);
            return user ? [{ user, at: row._max.createdAt! }] : [];
          }),
        };
      })()
    : null;

  const overdue = await prisma.assignment.findMany({
    where: { completedAt: null, round: { organizationId: organization.id, closedAt: null, dueAt: { lt: now } } },
    include: {
      user: { select: { id: true, name: true, lastName: true, middleName: true } },
      round: { select: { id: true, name: true, dueAt: true } },
    },
    orderBy: { round: { dueAt: "asc" } },
    take: 50,
  });

  const open = rounds
    ? await prisma.round.findMany({
        where: { organizationId: organization.id, closedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];
  const progress = await roundProgress(open.map((round) => round.id));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {waiting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {t("review")}
              {waiting.total > 0 && <Badge variant="secondary">{waiting.total}</Badge>}
            </CardTitle>
            <CardDescription>{t("reviewText")}</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            {waiting.rows.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title={t("reviewEmpty")} className="py-6" />
            ) : (
              <ul className="divide-y">
                {waiting.rows.map(({ user, at }) => (
                  <li key={user.id}>
                    <Link href={`${base}/reports/${user.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{formatFullName(user)}</span>
                        <span className="text-xs text-muted-foreground">{format.relativeTime(at, now)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {t("overdue")}
            {overdue.length > 0 && <Badge variant="destructive">{overdue.length}</Badge>}
          </CardTitle>
          <CardDescription>{t("overdueText")}</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-4">
          {overdue.length === 0 ? (
            <EmptyState icon={Clock} title={t("overdueEmpty")} className="py-6" />
          ) : (
            <ul className="divide-y">
              {overdue.slice(0, LIMIT).map((assignment) => (
                <li key={assignment.id}>
                  <Link
                    href={rounds ? `${base}/rounds/${assignment.round.id}` : `${base}/people/${assignment.user.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{formatFullName(assignment.user)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {assignment.round.name} ·{" "}
                        {t("dueWas", { date: format.dateTime(assignment.round.dueAt!, { dateStyle: "medium" }) })}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {rounds && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("rounds")}</CardTitle>
            <CardDescription>{t("roundsText")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {open.length === 0 ? (
              <EmptyState
                icon={Send}
                title={t("roundsEmpty")}
                className="py-6"
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${base}/rounds/new`}>{t("newRound")}</Link>
                  </Button>
                }
              />
            ) : (
              open.map((round) => {
                const stats = progress.get(round.id) ?? { people: 0, completed: 0, started: 0, overdue: 0 };
                return (
                  <Link key={round.id} href={`${base}/rounds/${round.id}`} className="flex flex-col gap-1.5 rounded-lg hover:opacity-80">
                    <span className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{round.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {stats.completed}/{stats.people}
                      </span>
                    </span>
                    <Progress value={stats.completed} max={stats.people} label={round.name} />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
