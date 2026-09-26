import { Card } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import type { QualityScore } from "@/utils/answer-quality";
import type { ScaleRow } from "@/utils/scoring";
import { formatFullName, formatWorkInfo, type Member } from "@/utils/user";
import { cn } from "@/utils/utils";
import { useFormatter, useTranslations } from "next-intl";
import { FlagBadge } from "./flag-badge";
import { LinkList } from "./link-list";
import { ProfileStrip } from "./results/profile-strip";

export type SubmissionListItem = {
  id: string;
  href: string;
  createdAt: Date;
  user: Member;
  // Test results only: the scale profile and answer quality, shown beside the date.
  profile?: ScaleRow[];
  quality?: QualityScore;
};

// People who submitted a test or questionnaire, each linking to their answers.
export function SubmissionList({ items }: { items: SubmissionListItem[] }) {
  const t = useTranslations("results");
  const quality = useTranslations("quality");
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
          trailing: (
            <span className="flex items-center gap-4">
              {item.profile && <ProfileStrip rows={item.profile} />}
              {item.quality && item.quality.band !== "good" && (
                <span className={cn("font-mono tabular-nums", item.quality.band === "poor" ? "text-destructive" : "text-warning")}>
                  {quality("short", { score: item.quality.score })}
                </span>
              )}
              <span>{format.dateTime(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
            </span>
          ),
        }))}
      />
    </Card>
  );
}
