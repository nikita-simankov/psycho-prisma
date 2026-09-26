import { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureMember } from "@/utils/authentication";
import { assignableRoles, can } from "@/utils/roles";
import { getFormatter, getTranslations } from "next-intl/server";
import { InviteDialog, RevokeInvitationButton } from "./components/member-controls";
import { UsersTable } from "./components/users-table";
import { BulkInviteDialog, ResendInvitationButton } from "./components/bulk-invite";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("people") };
}

export default async function Page() {
  const t = await getTranslations("people");
  const roles = await getTranslations("roles");
  const format = await getFormatter();
  const { membership, organization } = await ensureMember("viewDashboard");
  const manage = can(membership.role, "manageMembers");
  const [users, teams, invitations] = await Promise.all([
    findAllUsers(),
    findAllTeams(),
    manage ? findOpenInvitations() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description", { organization: organization.name })}
        actions={
          manage && (
            <>
              <BulkInviteDialog />
              <InviteDialog
                roles={assignableRoles(membership.role)}
                teams={teams.map((team) => ({ id: team.id, name: team.name }))}
              />
            </>
          )
        }
      />
      <div className="flex flex-col gap-6">
        <UsersTable users={users} />
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("invitations.title")}</CardTitle>
              <CardDescription>{t("invitations.description")}</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <ul className="divide-y">
                {invitations.map((invitation) => {
                  const expired = invitation.expiresAt < new Date();

                  return (
                    <li key={invitation.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {[roles(invitation.role), invitation.team?.name].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className={expired ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                        {expired
                          ? t("invitations.expired")
                          : t("invitations.expires", { date: format.dateTime(invitation.expiresAt, { dateStyle: "medium" }) })}
                      </span>
                      <div className="flex gap-1">
                        <ResendInvitationButton invitationId={invitation.id} email={invitation.email} />
                        <RevokeInvitationButton invitationId={invitation.id} email={invitation.email} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
