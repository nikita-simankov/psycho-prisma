import { findAllFormSubmissionsByUserId } from "@/actions/form-submission/find-all-form-submissions-by-user-id-action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTestSubmissionsByUserId } from "@/actions/test-submission/find-all-test-submissions-by-user-id-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { findAllTeams } from "@/actions/team/team-actions";
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
import { FlaskConical, NotepadText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditUserDialog from "./components/edit-user-dialog";
import { FlagSelect, MembershipDialog, RemoveMemberButton } from "../components/member-controls";

type PathParams = {
  params: {
    userId: string;
  };
};

type HistoryItem = { id: string; name: string; date: Date; href: string };

export default async function UserProfilePage({ params }: PathParams) {
  const t = await getTranslations("profile");
  const people = await getTranslations("people");
  const format = await getFormatter();
  const roles = await getTranslations("roles");
  const { user: viewer, membership, organization } = await ensureMember("viewDashboard");
  const manage = can(membership.role, "manageMembers");
  const [user, formSubmissions, testSubmissions, forms, tests, teams] = await Promise.all([
    findUserById(params.userId),
    findAllFormSubmissionsByUserId(params.userId),
    findAllTestSubmissionsByUserId(params.userId),
    findAllForms(),
    findAllTests(),
    findAllTeams(),
  ]);

  if (!user) {
    notFound();
  }

  const formNames = new Map(forms.map((form) => [form.id, form.name]));
  const testNames = new Map(tests.map((test) => [test.id, test.name]));

  const formHistory: HistoryItem[] = formSubmissions.map((submission) => ({
    id: submission.id,
    name: formNames.get(submission.formId) ?? "—",
    date: submission.createdAt,
    href: `/dashboard/forms/${submission.formId}/results/${submission.id}`,
  }));
  const testHistory: HistoryItem[] = testSubmissions.map((submission) => ({
    id: submission.id,
    name: testNames.get(submission.testId) ?? "—",
    date: submission.createdAt,
    href: `/dashboard/tests/${submission.testId}/results/${submission.id}`,
  }));

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
  ];

  const history = (title: string, items: HistoryItem[], icon: React.ReactNode) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <LinkList
          empty={t("nothingYet")}
          items={items.map((item) => ({
            id: item.id,
            href: item.href,
            title: item.name,
            subtitle: format.dateTime(item.date, { dateStyle: "medium", timeStyle: "short" }),
            leading: (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                {icon}
              </span>
            ),
          }))}
        />
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader
        title={t("title")}
        back={{ href: "/dashboard/users", label: people("back") }}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/summary/${user.id}`}>{t("openReport")}</Link>
            </Button>
            {manage && <EditUserDialog user={user} />}
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
                  <dd className="text-right font-medium">{detail.value || "—"}</dd>
                </div>
              ))}
            </dl>
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
          {history(t("testsTaken"), testHistory, <FlaskConical className="h-4 w-4" />)}
          {history(t("formsTaken"), formHistory, <NotepadText className="h-4 w-4" />)}
        </div>
      </div>
    </>
  );
}
