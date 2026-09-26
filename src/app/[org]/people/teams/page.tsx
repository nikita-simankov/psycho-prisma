import { EmptyState } from "@/components/empty-state";
import { findAllTeams } from "@/actions/team/team-actions";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { ChevronRight, Layers } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { TeamDialog } from "./team-controls";
import { organizationBase } from "@/utils/organization-path";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("teams") };
}

export default async function TeamsPage() {
  const base = await organizationBase();
  const t = await getTranslations("teams");
  const common = await getTranslations("common");
  const { membership } = await ensureMember("viewDashboard");
  const [teams, users] = await Promise.all([findAllTeams(), findAllUsers()]);
  const withoutTeam = users.filter((user) => !user.teamId).length;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={can(membership.role, "manageMembers") && <TeamDialog />}
      />
      {teams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("emptyTitle")}
          description={t("emptyText")}
          className="border-t border-foreground/80"
          action={can(membership.role, "manageMembers") && <TeamDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`${base}/people/teams/${team.id}`} className="group">
              <Card className="flex items-center gap-4 p-5 transition-colors group-hover:border-foreground/30">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground font-heading font-medium text-background">
                  {team.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading font-semibold">{team.name}</p>
                  <p className="text-sm text-muted-foreground">{common("people", { count: team._count.memberships })}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
      {withoutTeam > 0 && teams.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">{t("withoutTeam", { count: withoutTeam })}</p>
      )}
    </>
  );
}
