import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { isUserGroup } from "@/utils/groups";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    groupName: string;
  };
};

export default async function GroupPage({ params }: PathParams) {
  if (!isUserGroup(params.groupName)) {
    notFound();
  }

  const group = params.groupName;
  const t = await getTranslations("groupsPage");
  const groupNames = await getTranslations("groups");
  const users = (await findAllUsers()).filter((user) => user.group === group);

  return (
    <div className="p-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{groupNames(group)}</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
          {users.map((user) => (
            <div
              key={user.id}
              className="px-4 w-full h-16 hover:bg-accent transition-colors flex flex-row items-center justify-between"
            >
              <div className="flex flex-row items-center gap-3">
                <UserAvatar user={user} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{formatFullName(user)}</span>
                  <span className="text-xs text-muted-foreground">{formatWorkInfo(user)}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/users/${user.id}`}>{t("viewProfile")}</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
