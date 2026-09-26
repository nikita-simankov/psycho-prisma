import { findAllFormSubmissionsByUserId } from "@/actions/form-submission/find-all-form-submissions-by-user-id-action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTestSubmissionsByUserId } from "@/actions/test-submission/find-all-test-submissions-by-user-id-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { ScaleComparison } from "@/components/metrics/scale-comparison";
import { TrendCharts } from "@/components/metrics/trend-chart";
import { parseCustomFields } from "@/utils/profile-fields";
import { FlagBadge } from "@/components/flag-badge";
import { Badge } from "@/components/ui/badge";
import { LinkList } from "@/components/link-list";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { ensureMember } from "@/utils/authentication";
import { assignableRoles, can } from "@/utils/roles";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getFormatter, getTranslations } from "next-intl/server";
import { FileText, FlaskConical, Lock, NotepadText } from "lucide-react";
import { prisma } from "@/utils/database";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditUserDialog from "./components/edit-user-dialog";
import { FlagSelect, MembershipDialog, RemoveMemberButton } from "../components/member-controls";
import { organizationBase } from "@/utils/organization-path";
import { personSchedule } from "@/utils/rounds";
import { MIN_GROUP } from "@/utils/results";
import { loadPersonMetrics } from "./load-metrics";
import { ProfileDetailsDialog } from "./components/profile-details-dialog";

type PathParams = {
  params: Promise<{
    userId: string;
  }>;
};

type HistoryItem = { id: string; name: string; date: Date; href: string; kind: "test" | "form" | "report" };

export default async function UserProfilePage(props: PathParams) {
  const params = await props.params;
  const base = await organizationBase();
  const t = await getTranslations("profile");
  const people = await getTranslations("people");
  const format = await getFormatter();
  const roles = await getTranslations("roles");
  const metricsT = await getTranslations("metrics");
  const context = await ensureMember("viewDashboard");
  const { user: viewer, membership, organization } = context;
  const manage = can(membership.role, "manageMembers");
  const [user, formSubmissions, testSubmissions, forms, tests, teams, members, settings] = await Promise.all([
    findUserById(params.userId),
    findAllFormSubmissionsByUserId(params.userId),
    findAllTestSubmissionsByUserId(params.userId),
    findAllForms(),
    findAllTests(),
    findAllTeams(),
    findAllUsers(),
    prisma.organization.findUniqueOrThrow({ where: { id: organization.id }, select: { customFields: true } }),
  ]);

  if (!user) {
    notFound();
  }

  const [schedule, metrics] = await Promise.all([
    personSchedule(organization.id, user.id, user.teamId),
    loadPersonMetrics(context, user.id, user.teamId),
  ]);
  const customFields = parseCustomFields(settings.customFields);
  const manager = user.managerId ? members.find((member) => member.id === user.managerId) : undefined;
  const individual = can(membership.role, "viewIndividualResults");
  const versions = individual
    ? await prisma.reportVersion.findMany({
        where: { organizationId: organization.id, userId: user.id },
        orderBy: { version: "desc" },
      })
    : [];
  const rounds = await getTranslations("rounds");

  const formNames = new Map(forms.map((form) => [form.id, form.name]));
  const testNames = new Map(tests.map((test) => [test.id, test.name]));

  const formHistory: HistoryItem[] = formSubmissions.map((submission) => ({
    id: submission.id,
    name: formNames.get(submission.formId) ?? "—",
    date: submission.createdAt,
    href: `${base}/forms/${submission.formId}/results/${submission.id}`,
    kind: "form",
  }));
  const testHistory: HistoryItem[] = testSubmissions.map((submission) => ({
    id: submission.id,
    name: testNames.get(submission.testId) ?? "—",
    date: submission.createdAt,
    href: `${base}/tests/${submission.testId}/results/${submission.id}`,
    kind: "test",
  }));
  const reportHistory: HistoryItem[] = versions.map((version) => ({
    id: version.id,
    name: t("reportVersion", { version: version.version }),
    date: version.createdAt,
    href: `${base}/reports/${user.id}/versions/${version.version}`,
    kind: "report",
  }));
  // Everything that happened for this person, newest first.
  const timeline = [...testHistory, ...formHistory, ...reportHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
  const icons = {
    test: <FlaskConical className="h-4 w-4" />,
    form: <NotepadText className="h-4 w-4" />,
    report: <FileText className="h-4 w-4" />,
  };

  const details = [
    { label: t("fields.email"), value: user.email },
    { label: t("fields.phoneNumber"), value: user.phoneNumber },
    { label: t("fields.dateOfBirth"), value: user.dateOfBirth },
    { label: t("fields.team"), value: user.department },
    { label: t("fields.position"), value: user.position },
    {
      label: t("fields.joinedAt"),
      value: format.dateTime(user.joinedAt, { dateStyle: "medium" }),
    },
    { label: t("fields.startDate"), value: user.startDate ? format.dateTime(new Date(user.startDate), { dateStyle: "medium" }) : "" },
    { label: t("fields.employmentType"), value: user.employmentType ? t(`employment.${user.employmentType}`) : "" },
    { label: t("fields.location"), value: user.location },
    ...customFields.map((field) => {
      const value = user.customValues[field.key] ?? "";
      return {
        label: field.label,
        value: value && field.type === "date" ? format.dateTime(new Date(value), { dateStyle: "medium" }) : value,
      };
    }),
  ];
  const stats = [
    {
      label: metricsT("completion"),
      value: metrics.completion ? `${Math.round((metrics.completion.done / metrics.completion.total) * 100)}%` : "—",
      hint: metrics.completion ? metricsT("completionHint", metrics.completion) : metricsT("noRounds"),
    },
    {
      label: metricsT("lastAssessed"),
      value: metrics.lastAssessed ? format.dateTime(metrics.lastAssessed, { dateStyle: "medium" }) : "—",
      hint: metrics.lastAssessed ? format.relativeTime(metrics.lastAssessed) : metricsT("never"),
    },
    {
      label: t("nextDue"),
      value: schedule.nextDue ? format.dateTime(schedule.nextDue, { dateStyle: "medium" }) : "—",
      hint: schedule.nextDue ? format.relativeTime(schedule.nextDue) : metricsT("nothingScheduled"),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        crumb={formatFullName(user)}
        back={{ href: `${base}/people`, label: people("back") }}
        actions={
          <>
            {individual && (
              <Button variant="outline" asChild>
                <Link href={`${base}/reports/${user.id}`}>{t("openReport")}</Link>
              </Button>
            )}
            {can(membership.role, "viewAudit") && (
              <Button variant="ghost" asChild>
                <Link href={`${base}/settings/audit?person=${user.id}`}>{t("accessHistory")}</Link>
              </Button>
            )}
            {manage && <EditUserDialog user={user} />}
            {manage && (
              <ProfileDetailsDialog
                userId={user.id}
                name={formatFullName(user)}
                current={{
                  managerId: user.managerId,
                  startDate: user.startDate,
                  location: user.location,
                  employmentType: user.employmentType,
                  tags: user.tags,
                  customValues: user.customValues,
                }}
                managers={members
                  .filter((member) => member.id !== user.id && member.role !== "candidate")
                  .map((member) => ({ id: member.id, name: formatFullName(member) }))}
                fields={customFields}
              />
            )}
            {manage && (
              <MembershipDialog
                userId={user.id}
                name={formatFullName(user)}
                current={{ role: user.role, teamId: user.teamId, position: user.position }}
                roles={
                  user.id === viewer.id || (user.role === "owner" && membership.role !== "owner")
                    ? []
                    : assignableRoles(membership.role)
                }
                teams={teams.map((team) => ({ id: team.id, name: team.name }))}
              />
            )}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="items-center text-center">
            <UserAvatar user={user} className="mb-2 h-20 w-20 text-lg" />
            <CardTitle className="text-xl">{formatFullName(user)}</CardTitle>
            <CardDescription>{formatWorkInfo(user)}</CardDescription>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Badge variant="secondary">{roles(user.role)}</Badge>
              <FlagBadge flag={user.flag} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="divide-y rounded-lg border text-sm">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-4 px-3 py-2.5">
                  <dt className="text-muted-foreground">{detail.label}</dt>
                  <dd className="min-w-0 wrap-break-word text-right font-medium">{detail.value || "—"}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                <dt className="text-muted-foreground">{t("fields.manager")}</dt>
                <dd className="min-w-0 text-right font-medium">
                  {manager ? (
                    <Link href={`${base}/people/${manager.id}`} className="underline-offset-4 hover:underline">
                      {formatFullName(manager)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
            {user.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5" aria-label={t("fields.tags")}>
                {user.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {can(membership.role, "viewSensitive") && (
              <div className="mt-4 rounded-lg border border-dashed p-3">
                <FlagSelect userId={user.id} flag={user.flag} />
              </div>
            )}
            {manage && user.id !== viewer.id && (user.role !== "owner" || membership.role === "owner") && (
              <div className="mt-4 flex justify-end">
                <RemoveMemberButton userId={user.id} name={formatFullName(user)} organization={organization.name} />
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex min-w-0 flex-col gap-6">
          <dl className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5 rounded-xl border bg-card p-4">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="font-heading text-xl font-semibold tabular-nums">{stat.value}</dd>
                <dd className="text-xs text-muted-foreground">{stat.hint}</dd>
              </div>
            ))}
          </dl>
          {metrics.tests.map((test) => (
            <Card key={test.testId}>
              <CardHeader>
                <CardTitle className="text-lg">{test.testName}</CardTitle>
                <CardDescription>
                  {metricsT("resultCount", { count: test.count, date: format.dateTime(test.latestAt, { dateStyle: "medium" }) })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">{metricsT("comparison")}</h3>
                  <ScaleComparison
                    rows={test.latest}
                    team={test.team && { label: metricsT("series.team", { team: test.team.teamName ?? "" }), average: test.team }}
                    everyone={test.everyone && { label: metricsT("series.everyone"), average: test.everyone }}
                  />
                  {!test.team && !test.everyone && <p className="text-xs text-muted-foreground">{metricsT("noGroups", { min: MIN_GROUP })}</p>}
                </section>
                {test.count > 1 && (
                  <section className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">{metricsT("trends")}</h3>
                    <TrendCharts trends={test.trends} />
                  </section>
                )}
              </CardContent>
            </Card>
          ))}
          {schedule.open.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("openRounds")}</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                <LinkList
                  empty={t("nothingYet")}
                  items={schedule.open.map((entry) => ({
                    id: entry.id,
                    href: can(membership.role, "manageRounds") ? `${base}/rounds/${entry.round.id}` : "#",
                    title: entry.round.name,
                    subtitle: `${rounds("partDone", { done: entry.done, total: entry.total })}${
                      entry.round.dueAt
                        ? ` · ${rounds("dueOn", { date: format.dateTime(entry.round.dueAt, { dateStyle: "medium" }) })}`
                        : ""
                    }`,
                  }))}
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("timeline")}</CardTitle>
              {!individual && (
                <CardDescription className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t("averagesOnly")}
                </CardDescription>
              )}
            </CardHeader>
            {individual && (
              <CardContent className="px-2 sm:px-4">
                <LinkList
                  empty={t("nothingYet")}
                  items={timeline.map((item) => ({
                    id: item.id,
                    href: item.href,
                    title: item.name,
                    subtitle: format.dateTime(item.date, { dateStyle: "medium", timeStyle: "short" }),
                    leading: (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        {icons[item.kind]}
                      </span>
                    ),
                  }))}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
