import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName, formatWorkInfo, type Member } from "@/utils/user";
import { useFormatter, useTranslations } from "next-intl";
import { FlagBadge } from "./flag-badge";
import { LinkList } from "./link-list";

export type SubmissionListItem = {
  id: string;
  href: string;
  createdAt: Date;
  user: Member;
};

// People who submitted a test or questionnaire, each linking to their answers.
export function SubmissionList({ items }: { items: SubmissionListItem[] }) {
  const t = useTranslations("results");
  const format = useFormatter();

  return (
    <Card className="p-2 sm:p-4">
      <LinkList
        empty={t("empty")}
        items={items.map((item) => ({
          id: item.id,
          href: item.href,
          title: (
            <span className="inline-flex items-center gap-2">
              {formatFullName(item.user)}
              <FlagBadge flag={item.user.flag} />
            </span>
          ),
          subtitle: formatWorkInfo(item.user),
          leading: <UserAvatar user={item.user} className="h-9 w-9" />,
          trailing: format.dateTime(item.createdAt, { dateStyle: "medium", timeStyle: "short" }),
        }))}
      />
    </Card>
  );
}
