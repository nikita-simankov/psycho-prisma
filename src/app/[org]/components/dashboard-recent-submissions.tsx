import { findRecentTestSubmissions } from "@/actions/test-submission/find-recent-test-submissions-action";
import { Section } from "@/components/page-templates";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName } from "@/utils/user";
import { ChevronRight, Inbox } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { organizationBase } from "@/utils/organization-path";

export async function DashboardRecentSubmissions() {
  const base = await organizationBase();
  const t = await getTranslations("dashboard.recent");
  const format = await getFormatter();
  const rows = await findRecentTestSubmissions(10);

  return (
    <Section title={t("title")} description={t("description")}>
      <div>
        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8" />
            {t("empty")}
          </div>
        )}
        <ul className="divide-y">
          {rows.map(({ submission, user, testName }) => (
            <li key={submission.id}>
              <Link
                href={`${base}/tests/${submission.testId}/results/${submission.id}`}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-card"
              >
                <UserAvatar user={user} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{formatFullName(user)}</p>
                  <p className="truncate text-sm text-muted-foreground">{testName}</p>
                </div>
                <time className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
                  {format.relativeTime(submission.createdAt, new Date())}
                </time>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="sr-only">{t("viewResult")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
