import { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { staffSeats } from "@/utils/billing";
import { assignableRoles, can } from "@/utils/roles";
import { cn } from "@/utils/utils";
import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BulkInviteDialog } from "./components/bulk-invite";
import { InvitationList } from "./components/invitation-list";
import { InvitePanel } from "./components/invite-panel";
import { UsersTable } from "./components/users-table";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("people") };
}

export default async function Page(props: { searchParams: Promise<{ tab?: string }> }) {
  const t = await getTranslations("people");
  const { membership, organization } = await ensureMember("viewDashboard");
  const manage = can(membership.role, "manageMembers");
  const pending = manage && (await props.searchParams).tab === "pending";
  const [users, teams, invitations, seats] = await Promise.all([
    findAllUsers(),
    findAllTeams(),
    manage ? findOpenInvitations() : Promise.resolve([]),
    manage ? staffSeats(organization.id) : Promise.resolve({ used: 0, limit: null }),
  ]);
  const base = `/${organization.slug}/people`;
  const tabs = [
    { key: "people", href: base, label: t("tabs.people"), active: !pending },
    { key: "pending", href: `${base}?tab=pending`, label: t("tabs.pending", { count: invitations.length }), active: pending },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description", { organization: organization.name })}
        actions={
          manage && (
            <>
              <BulkInviteDialog />
              <InvitePanel
                roles={assignableRoles(membership.role)}
                teams={teams.map((team) => ({ id: team.id, name: team.name }))}
                seats={seats}
              />
            </>
          )
        }
      />
      {manage && (
        <nav aria-label={t("tabs.label")} className="-mt-2 mb-6 flex h-10 items-center gap-5 border-b">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex h-10 items-center border-b-2 text-sm font-medium transition-colors",
                tab.active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
      {pending ? (
        <InvitationList invitations={invitations} />
      ) : (
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
      )}
    </>
  );
}
