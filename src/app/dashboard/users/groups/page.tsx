import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { GROUP_STYLES, USER_GROUPS } from "@/utils/groups";
import { cn } from "@/utils/utils";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("groups") };
}

export default async function GroupsPage() {
  const t = await getTranslations("groupsPage");
  const groupNames = await getTranslations("groups");
  const common = await getTranslations("common");
  const users = await findAllUsers();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {USER_GROUPS.map((group) => {
          const count = users.filter((user) => user.group === group).length;

          return (
            <Link key={group} href={`/dashboard/users/groups/${group}`} className="group">
              <Card className="flex items-center gap-4 p-5 transition-colors group-hover:border-primary/40">
                <span className={cn("h-3 w-3 shrink-0 rounded-full", GROUP_STYLES[group].dot)} />
                <div className="flex-1">
                  <p className="font-heading font-semibold">{groupNames(group)}</p>
                  <p className="text-sm text-muted-foreground">{common("people", { count })}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
