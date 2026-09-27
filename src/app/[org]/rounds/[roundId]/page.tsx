import { Section } from "@/components/page-templates";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UserAvatar from "@/components/ui/user-avatar";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { describeItems, itemKey, parseItems, submittedItems } from "@/utils/rounds";
import { formatFullName, publicUserSelect } from "@/utils/user";
import { Repeat } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddPeopleDialog, AssignmentMenu, RoundStateButton, RoundTracker } from "./round-controls";
import { HealthChip } from "@/components/rounds/health-chip";
import { roundHealth } from "@/utils/round-health";
import { PulseResults } from "@/components/wellbeing/pulse-results";
import { TeamActionsEditor } from "@/components/wellbeing/team-actions-editor";
import { pulseResults } from "@/utils/pulse";
import { MIN_GROUP } from "@/utils/results";
import { can } from "@/utils/roles";
import { pulseResultsReady, type ActionStatus } from "@/utils/wellbeing";

type Status = "finished" | "started" | "notStarted" | "overdue" | "scheduled";
const STATUS_VARIANT = { finished: "secondary", started: "outline", notStarted: "outline", overdue: "destructive", scheduled: "outline" } as const;

export default async function RoundPage(props: { params: Promise<{ roundId: string }> }) {
  const params = await props.params;
  const { organization, membership } = await ensureMember("manageRounds");
  const base = await organizationBase();
  const t = await getTranslations("rounds");
  const format = await getFormatter();
  const locale = await getLocale();

  const round = await prisma.round.findFirst({
    where: { id: params.roundId, organizationId: organization.id },
    include: {
      assignments: { include: { user: { select: publicUserSelect } }, orderBy: { createdAt: "asc" } },
      schedule: { select: { intervalMonths: true, trigger: true } },
      _count: { select: { invitees: true } },
    },
  });

  if (!round) {
    notFound();
  }

  const items = parseItems(round.items);
  const [done, info, members] = await Promise.all([
    submittedItems(round.assignments.map((assignment) => assignment.id)),
    describeItems(items, locale),
    findAllUsers(),
  ]);
  const now = new Date();
  const finished = round.assignments.filter((assignment) => assignment.completedAt).length;

  const rows = round.assignments.map((assignment) => {
    const own = parseItems(assignment.items);
    const count = done.get(assignment.id)?.size ?? 0;
    const status: Status = assignment.completedAt
      ? "finished"
      : !assignment.invitedAt && assignment.sendAt
        ? "scheduled"
      : round.dueAt && round.dueAt < now && !round.closedAt
        ? "overdue"
        : count
          ? "started"
          : "notStarted";
    return { assignment, total: own.length, count, status };
  });

  const counts = {
    finished,
    started: rows.filter((row) => row.status === "started" || (row.status === "overdue" && row.count > 0)).length,
    notStarted: rows.filter((row) => row.count === 0 && (row.status === "notStarted" || row.status === "overdue")).length,
    scheduled: rows.filter((row) => row.status === "scheduled").length,
  };
  const health = roundHealth(round, { people: round.assignments.length, completed: finished }, now);

  const assigned = new Set(round.assignments.map((assignment) => assignment.userId));
  // Anonymous rounds show group averages only, and only once answers stop arriving.
  const wellbeing = round.purpose === "wellbeing";
  const ready = pulseResultsReady(round, now);
  const [pulse, teams, actions] = wellbeing
    ? await Promise.all([
        round.anonymous && ready
          ? prisma.test
              .findMany({
                where: {
                  id: { in: items.filter((item) => item.kind === "test").map((item) => item.id) },
                  ...(!can(membership.role, "viewSensitive") && { sensitive: false }),
                },
              })
              .then((tests) => pulseResults(round, tests, locale))
          : Promise.resolve([]),
        prisma.team.findMany({ where: { organizationId: organization.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.teamAction.findMany({
          where: { organizationId: organization.id, roundId: round.id },
          include: { team: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        }),
      ])
    : [[], [], []];
  const pulseT = await getTranslations("wellbeing.pulse");
  const actionsT = await getTranslations("wellbeing.actions");

  const addable = members
    .filter((member) => member.role !== "candidate" && !assigned.has(member.id))
    .map((member) => ({ id: member.id, name: formatFullName(member) }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={round.name}
        className="mb-0"
        back={{ href: `${base}/rounds`, label: t("title") }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t(`purposes.${round.purpose}` as "purposes.development")}</Badge>
            <HealthChip health={health} />
            {round.schedule && (
              <Badge variant="outline" className="gap-1">
                <Repeat className="h-3 w-3" />
                {round.schedule.trigger === "interval"
                  ? t("cycleOf", { cycle: round.cycle, count: round.schedule.intervalMonths })
                  : t("automatic")}
              </Badge>
            )}
            {round.closedAt && <Badge variant="outline">{t("closedBadge")}</Badge>}
            {round.anonymous && <Badge variant="outline">{t("anonymousBadge")}</Badge>}
            <span className="text-sm">
              {round.dueAt ? t("dueOn", { date: format.dateTime(round.dueAt, { dateStyle: "medium" }) }) : t("noDue")}
            </span>
          </span>
        }
        actions={
          <>
            {!round.closedAt && <AddPeopleDialog roundId={round.id} people={addable} />}
            <RoundStateButton roundId={round.id} closed={round.closedAt !== null} />
          </>
        }
      />

      <div className="grid gap-10 lg:grid-cols-3">
        <Section title={t("progressLabel")} description={t("completedOf", { done: finished, total: round.assignments.length })} className="lg:col-span-1">
          <div className="flex flex-col gap-4">
            <RoundTracker
              roundId={round.id}
              counts={counts}
              total={round.assignments.length}
              waiting={round._count.invitees}
              open={!round.closedAt}
            />
            <ul className="flex flex-col gap-2 text-sm">
              {items.map((item) => (
                <li key={itemKey(item)} className="flex justify-between gap-2">
                  <span>{info.get(itemKey(item))?.name ?? "—"}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {t("itemDone", {
                      count: rows.filter(({ assignment }) => done.get(assignment.id)?.has(itemKey(item))).length,
                    })}
                  </span>
                </li>
              ))}
            </ul>
            {round.message && (
              <p className="whitespace-pre-line border-l-2 pl-3 font-heading italic text-muted-foreground">{round.message}</p>
            )}
          </div>
        </Section>

        <Section title={t("peopleTitle")} className="lg:col-span-2">
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t("person")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("finishedAt")}</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">{t("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ assignment, total, count, status }) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="pl-6">
                      <Link href={`${base}/people/${assignment.userId}`} className="flex items-center gap-3 font-medium hover:text-primary">
                        <UserAvatar user={assignment.user} className="h-8 w-8" />
                        <span className="flex flex-col">
                          {formatFullName(assignment.user)}
                          <span className="text-xs font-normal text-muted-foreground">{assignment.user.email}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={STATUS_VARIANT[status]} className="w-fit">
                          {t(`statuses.${status}`)}
                        </Badge>
                        {status !== "finished" && (
                          <span className="text-xs text-muted-foreground">{t("partDone", { done: count, total })}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {assignment.completedAt ? format.dateTime(assignment.completedAt, { dateStyle: "medium" }) : "—"}
                    </TableCell>
                    <TableCell className="pr-6">
                      <AssignmentMenu
                        assignmentId={assignment.id}
                        name={formatFullName(assignment.user)}
                        open={!assignment.completedAt && !round.closedAt}
                        reminded={assignment.remindedAt !== null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>
      </div>

      {round.anonymous && (
        <Section title={pulseT("title")} description={pulseT("text", { min: MIN_GROUP })}>
          {ready ? <PulseResults results={pulse} everyoneLabel={pulseT("everyone")} /> : <p className="text-sm text-muted-foreground">{pulseT("waiting")}</p>}
        </Section>
      )}

      {wellbeing && (
        <Section title={actionsT("title")} description={actionsT("staffText")}>
          <TeamActionsEditor
            roundId={round.id}
            teams={teams}
            actions={actions.map((action) => ({
              id: action.id,
              teamId: action.teamId,
              teamName: action.team?.name ?? null,
              text: action.text,
              status: action.status as ActionStatus,
            }))}
          />
        </Section>
      )}
    </div>
  );
}
