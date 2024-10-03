import { findAllTestSubmissions } from "@/actions/test-submission/find-all-test-submissions-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const DashboardRecentSubmissions: React.FC = async () => {
  const submissions = await (await findAllTestSubmissions()).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Недавние ответы</CardTitle>
        <CardDescription>Недавние ответы на тестовые методики</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.map(async (submission) => {
          const user = await findUserById(submission.userId);
          const test = await findTestById(submission.testId);

          return (
            <div className="w-full px-4 py-2 hover:bg-accent text-sm font-semibold tracking-wide flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-6">
                <Avatar>
                  <AvatarFallback>
                    {user?.lastName.at(0)! + user?.name.at(0)!}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {user?.lastName} {user?.name} {user?.surname} ({test?.name})
                </span>
              </div>

              <Link
                href={
                  "/dashboard/tests/" + test?.id + "/results/" + submission.id
                }
              >
                <Button size="sm" className="flex flex-row items-center gap-2">
                  Смотреть результат
                  <ArrowUpRight className="w-[1.2rem] h-[1.2rem]" />
                </Button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
