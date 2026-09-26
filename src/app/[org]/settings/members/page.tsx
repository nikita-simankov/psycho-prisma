import { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { findJoinLinks } from "@/actions/invitation/join-link-actions";
import { staffSeats } from "@/utils/billing";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Section } from "@/components/page-templates";
import { Badge } from "@/components/ui/badge";
import { ensureMember } from "@/utils/authentication";
import { organizationBase } from "@/utils/organization-path";
import { assignableRoles, ROLES, STAFF_ROLES } from "@/utils/roles";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BulkInviteDialog } from "../../people/components/bulk-invite";
import { InvitePanel } from "../../people/components/invite-panel";
import { InvitationList } from "../../people/components/invitation-list";
import { JoinLinks } from "../../people/components/join-links";

export async function generateMetadata() {
  const t = await getTranslations("settings.sections");
  return { title: t("members") };
}

// Who works in the dashboard, how many people hold each role, and invitations not yet accepted.
export default async function MembersPage() {
  const t = await getTranslations("people");
  const s = await getTranslations("settings.members");
  const roles = await getTranslations("roles");
  const { membership, organization } = await ensureMember("manageMembers");
  const base = await organizationBase();
  const [users, teams, invitations, seats, joinLinks] = await Promise.all([
    findAllUsers(),
    findAllTeams(),
    findOpenInvitations(),
    staffSeats(organization.id),
    findJoinLinks(),
  ]);
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
            <InvitePanel roles={assignableRoles(membership.role)} teams={teams.map((team) => ({ id: team.id, name: team.name }))} seats={seats} />
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
        <InvitationList invitations={invitations} />
      </Section>

      <Section title={s("joinLinks")} description={s("joinLinksText")}>
        <JoinLinks links={joinLinks} teams={teams.map((team) => ({ id: team.id, name: team.name }))} />
      </Section>
    </div>
  );
}
