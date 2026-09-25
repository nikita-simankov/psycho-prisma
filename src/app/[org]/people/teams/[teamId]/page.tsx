import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { FlagBadge } from "@/components/flag-badge";
import { LinkList } from "@/components/link-list";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DeleteTeamButton, TeamDialog } from "../team-controls";
import { organizationBase } from "@/utils/organization-path";

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const base = organizationBase();
  const t = await getTranslations("teams");
  const common = await getTranslations("common");
  const { membership } = await ensureMember("viewDashboard");
  const [teams, users] = await Promise.all([findAllTeams(), findAllUsers()]);
  const team = teams.find((item) => item.id === params.teamId);

  if (!team) {
    notFound();
  }

  const members = users.filter((user) => user.teamId === team.id);

  return (
    <>
      <PageHeader
        title={team.name}
        description={common("people", { count: members.length })}
        back={{ href: `${base}/people/teams`, label: t("title") }}
        actions={
          can(membership.role, "manageMembers") && (
            <>
              <DeleteTeamButton team={team} />
              <TeamDialog team={team} />
            </>
          )
        }
      />
      <Card className="p-2 sm:p-4">
        <LinkList
          empty={t("teamEmpty")}
          items={members.map((user) => ({
            id: user.id,
            href: `${base}/people/${user.id}`,
            title: (
              <span className="inline-flex flex-wrap items-center gap-2">
                {formatFullName(user)}
                <FlagBadge flag={user.flag} />
              </span>
            ),
            subtitle: user.position,
            leading: <UserAvatar user={user} className="h-9 w-9" />,
          }))}
        />
      </Card>
    </>
  );
}
