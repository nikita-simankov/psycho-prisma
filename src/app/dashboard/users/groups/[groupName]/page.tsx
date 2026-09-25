import { findAllUsers } from "@/actions/user/find-all-users-action";
import { LinkList } from "@/components/link-list";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { isUserGroup } from "@/utils/groups";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getTranslations } from "next-intl/server";
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
  const common = await getTranslations("common");
  const users = (await findAllUsers()).filter((user) => user.group === group);

  return (
    <>
      <PageHeader
        title={groupNames(group)}
        description={common("people", { count: users.length })}
        back={{ href: "/dashboard/users/groups", label: t("title") }}
      />
      <Card className="p-2 sm:p-4">
        <LinkList
          empty={t("empty")}
          items={users.map((user) => ({
            id: user.id,
            href: `/dashboard/users/${user.id}`,
            title: formatFullName(user),
            subtitle: formatWorkInfo(user),
            leading: <UserAvatar user={user} className="h-9 w-9" />,
          }))}
        />
      </Card>
    </>
  );
}
