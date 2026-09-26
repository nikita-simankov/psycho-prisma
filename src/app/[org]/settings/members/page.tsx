import { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/page-templates";
import { Badge } from "@/components/ui/badge";
import { ensureMember } from "@/utils/authentication";
import { organizationBase } from "@/utils/organization-path";
import { assignableRoles, ROLES, STAFF_ROLES } from "@/utils/roles";
import { formatFullName } from "@/utils/user";
import { MailPlus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { BulkInviteDialog, ResendInvitationButton } from "../../people/components/bulk-invite";
import { InviteDialog, RevokeInvitationButton } from "../../people/components/member-controls";

export async function generateMetadata() {
  const t = await getTranslations("settings.sections");
  return { title: t("members") };
}

// Who works in the dashboard, how many people hold each role, and invitations not yet accepted.
export default async function MembersPage() {
  const t = await getTranslations("people");
  const s = await getTranslations("settings.members");
  const roles = await getTranslations("roles");
  const format = await getFormatter();
  const { membership } = await ensureMember("manageMembers");
  const base = await organizationBase();
  const [users, teams, invitations] = await Promise.all([findAllUsers(), findAllTeams(), findOpenInvitations()]);
  const staff = users.filter((user) => (STAFF_ROLES as readonly string[]).includes(user.role));
  const counts = ROLES.map((role) => ({ role, count: users.filter((user) => user.role === role).length })).filter((entry) => entry.count > 0);

  return (
    <div className="flex flex-col gap-12">
      <Section
        title={s("staff")}
        description={s("staffText")}
        actions={
          <>
            <BulkInviteDialog />
            <InviteDialog roles={assignableRoles(membership.role)} teams={teams.map((team) => ({ id: team.id, name: team.name }))} />
          </>
        }
      >
        <ul className="divide-y border-y">
          {staff.map((user) => (
            <li key={user.id}>
              <Link href={`${base}/people/${user.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-card">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{formatFullName(user)}</span>
                  <span className="block truncate text-sm text-muted-foreground">{user.email}</span>
                </span>
                <Badge variant={user.role === "owner" ? "default" : "secondary"}>{roles(user.role)}</Badge>
              </Link>
            </li>
          ))}
        </ul>
        <p className="font-mono text-xs text-muted-foreground">
          {counts.map(({ role, count }) => `${roles(role)} ${count}`).join(" · ")}
        </p>
      </Section>

      <Section title={t("invitations.title")} description={t("invitations.description")}>
        {invitations.length === 0 ? (
          <EmptyState icon={MailPlus} title={s("noInvitations")} description={s("noInvitationsText")} />
        ) : (
          <ul className="divide-y border-y">
            {invitations.map((invitation) => {
              const expired = invitation.expiresAt < new Date();

              return (
                <li key={invitation.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {[roles(invitation.role), invitation.team?.name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className={expired ? "font-mono text-xs text-destructive" : "font-mono text-xs text-muted-foreground"}>
                    {invitation.held
                      ? t("invitations.held")
                      : expired
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
        )}
      </Section>
    </div>
  );
}
