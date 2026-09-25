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

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("teams") };
}

export default async function TeamsPage() {
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
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Layers className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t("emptyText")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/dashboard/users/teams/${team.id}`} className="group">
              <Card className="flex items-center gap-4 p-5 transition-colors group-hover:border-primary/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent font-heading font-bold text-accent-foreground">
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
