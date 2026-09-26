import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { AddPeopleDialog, AssignmentMenu, RoundStateButton } from "./round-controls";

type Status = "finished" | "started" | "notStarted" | "overdue";
const STATUS_VARIANT = { finished: "secondary", started: "outline", notStarted: "outline", overdue: "destructive" } as const;

export default async function RoundPage({ params }: { params: { roundId: string } }) {
  const { organization } = await ensureMember("manageRounds");
  const base = organizationBase();
  const t = await getTranslations("rounds");
  const format = await getFormatter();
  const locale = await getLocale();

  const round = await prisma.round.findFirst({
    where: { id: params.roundId, organizationId: organization.id },
    include: {
      assignments: { include: { user: { select: publicUserSelect } }, orderBy: { createdAt: "asc" } },
      schedule: { select: { intervalMonths: true } },
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
      : round.dueAt && round.dueAt < now && !round.closedAt
        ? "overdue"
        : count
          ? "started"
          : "notStarted";
    return { assignment, total: own.length, count, status };
  });

  const assigned = new Set(round.assignments.map((assignment) => assignment.userId));
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
            {round.schedule && (
              <Badge variant="outline" className="gap-1">
                <Repeat className="h-3 w-3" />
                {t("cycleOf", { cycle: round.cycle, count: round.schedule.intervalMonths })}
              </Badge>
            )}
            {round.closedAt && <Badge variant="outline">{t("closedBadge")}</Badge>}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t("progressLabel")}</CardTitle>
            <CardDescription>{t("completedOf", { done: finished, total: round.assignments.length })}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={finished} max={round.assignments.length} label={t("progressLabel")} />
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
              <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm">{round.message}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t("peopleTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
