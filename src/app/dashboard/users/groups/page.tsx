import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { USER_GROUPS } from "@/utils/groups";
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
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">{t("title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {USER_GROUPS.map((group) => {
          const count = users.filter((user) => user.group === group).length;

          return (
            <Card key={group} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle>{groupNames(group)}</CardTitle>
              </CardHeader>
              <CardContent>{common("people", { count })}</CardContent>
              <CardFooter>
                <Button asChild disabled={count === 0}>
                  <Link href={`/dashboard/users/groups/${group}`}>{t("open")}</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
