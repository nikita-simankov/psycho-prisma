import { findAllTestSubmissions } from "@/actions/test-submission/find-all-test-submissions-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName } from "@/utils/user";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function DashboardRecentSubmissions() {
  const t = await getTranslations("dashboard.recent");
  const [submissions, users, tests] = await Promise.all([
    findAllTestSubmissions(),
    findAllUsers(),
    findAllTests(),
  ]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const testsById = new Map(tests.map((test) => [test.id, test]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        )}
        {submissions.slice(0, 10).map((submission) => {
          const user = usersById.get(submission.userId);
          const test = testsById.get(submission.testId);

          if (!user || !test) {
            return null;
          }

          return (
            <div
              key={submission.id}
              className="w-full px-4 py-2 hover:bg-accent text-sm font-semibold tracking-wide flex flex-row items-center justify-between"
            >
              <div className="flex flex-row items-center gap-6">
                <UserAvatar user={user} />
                <span>
                  {formatFullName(user)} ({test.name})
                </span>
              </div>

              <Button size="sm" asChild>
                <Link
                  href={`/dashboard/tests/${test.id}/results/${submission.id}`}
                  className="flex flex-row items-center gap-2"
                >
                  {t("viewResult")}
                  <ArrowUpRight className="w-[1.2rem] h-[1.2rem]" />
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
