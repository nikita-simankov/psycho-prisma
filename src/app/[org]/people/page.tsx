import { EmptyState } from "@/components/empty-state";
import { UserPlus } from "lucide-react";
import { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ensureMember } from "@/utils/authentication";
import { assignableRoles, can } from "@/utils/roles";
import { getTranslations } from "next-intl/server";
import { InviteDialog } from "./components/member-controls";
import { UsersTable } from "./components/users-table";
import { BulkInviteDialog } from "./components/bulk-invite";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("people") };
}

export default async function Page() {
  const t = await getTranslations("people");
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
        <UsersTable
          users={users}
          empty={
            <EmptyState
              icon={UserPlus}
              title={t("empty.title")}
              description={manage ? t("empty.manage") : t("empty.view")}
            />
          }
        />
        {invitations.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <Link href={`/${organization.slug}/settings/members`} className="font-medium text-primary hover:underline">
              {t("invitations.pending", { count: invitations.length })}
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
