import { findAllTestSubmissionsByTestId } from "@/actions/test-submission/find-all-test-submissions-by-test-id-action";
import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { redirect } from "next/navigation";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function UserSubmissionPage({ params }: PathParams) {
  const test = await findTestById(params.testId);
  const submissions = await findAllTestSubmissionsByTestId(params.testId);

  return (
    <div className="p-12 flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-wide">
        Результаты тестирования по методике "{test?.name}"
      </h1>

      <Separator />

      <div className="grid grid-cols-4 gap-2">
        {submissions.map(async (submission) => {
          const user = await findUserById(submission.userId);

          return (
            <Link
              href={
                "/dashboard/tests/" + test?.id + "/results/" + submission.id
              }
            >
              <Card className="cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-bold tracking-wide">
                    {user?.lastName} {user?.name} {user?.surname}
                  </CardTitle>
                  <CardDescription>
                    Добавлено {submission.createdAt.toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
