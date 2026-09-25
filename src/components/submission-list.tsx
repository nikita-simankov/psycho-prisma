import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFullName, formatWorkInfo, PublicUser } from "@/utils/user";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { GroupBadge } from "./group-badge";

export type SubmissionListItem = {
  id: string;
  href: string;
  createdAt: Date;
  user: PublicUser;
};

// Grid of people who submitted a test or questionnaire, each linking to their answers.
export function SubmissionList({ items }: { items: SubmissionListItem[] }) {
  const t = useTranslations("results");
  const format = useFormatter();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((item) => (
        <Link key={item.id} href={item.href}>
          <Card className="h-full hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">
                  {formatFullName(item.user)}
                </CardTitle>
                <CardDescription>{formatWorkInfo(item.user)}</CardDescription>
                <CardDescription>
                  {t("submittedAt", {
                    date: format.dateTime(item.createdAt, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  })}
                </CardDescription>
              </div>
              <GroupBadge group={item.user.group} />
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
