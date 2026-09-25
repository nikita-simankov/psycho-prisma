import { findAllUsers } from "@/actions/user/find-all-users-action";
import { FlagBadge } from "@/components/flag-badge";
import { LinkList } from "@/components/link-list";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { ensureMember } from "@/utils/authentication";
import { FLAGS } from "@/utils/flags";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { organizationBase } from "@/utils/organization-path";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("followUp") };
}

// People with a restricted follow-up flag, most urgent first. Psychologists and owners only.
export default async function FollowUpPage() {
  const base = organizationBase();
  const t = await getTranslations("followUp");
  await ensureMember("viewSensitive");
  const users = (await findAllUsers())
    .filter((user) => user.flag)
    .sort((a, b) => FLAGS.indexOf(b.flag as never) - FLAGS.indexOf(a.flag as never));

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        {t("restricted")}
      </p>
      <Card className="p-2 sm:p-4">
        <LinkList
          empty={t("empty")}
          items={users.map((user) => ({
            id: user.id,
            href: `${base}/people/${user.id}`,
            title: (
              <span className="inline-flex flex-wrap items-center gap-2">
                {formatFullName(user)}
                <FlagBadge flag={user.flag} />
              </span>
            ),
            subtitle: formatWorkInfo(user),
            leading: <UserAvatar user={user} className="h-9 w-9" />,
          }))}
        />
      </Card>
    </>
  );
}
