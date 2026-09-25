import { findAllFormSubmissionsByUserId } from "@/actions/form-submission/find-all-form-submissions-by-user-id-action";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { findAllTestSubmissionsByUserId } from "@/actions/test-submission/find-all-test-submissions-by-user-id-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { GroupBadge } from "@/components/group-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditUserDialog from "./components/edit-user-dialog";

type PathParams = {
  params: {
    userId: string;
  };
};

type HistoryItem = { id: string; name: string; date: Date; href: string };

export default async function UserProfilePage({ params }: PathParams) {
  const t = await getTranslations("profile");
  const format = await getFormatter();
  const [user, formSubmissions, testSubmissions, forms, tests] = await Promise.all([
    findUserById(params.userId),
    findAllFormSubmissionsByUserId(params.userId),
    findAllTestSubmissionsByUserId(params.userId),
    findAllForms(),
    findAllTests(),
  ]);

  if (!user) {
    notFound();
  }

  const formNames = new Map(forms.map((form) => [form.id, form.name]));
  const testNames = new Map(tests.map((test) => [test.id, test.name]));

  const formHistory: HistoryItem[] = formSubmissions.map((submission) => ({
    id: submission.id,
    name: formNames.get(submission.formId) ?? "—",
    date: submission.createdAt,
    href: `/dashboard/forms/${submission.formId}/results/${submission.id}`,
  }));
  const testHistory: HistoryItem[] = testSubmissions.map((submission) => ({
    id: submission.id,
    name: testNames.get(submission.testId) ?? "—",
    date: submission.createdAt,
    href: `/dashboard/tests/${submission.testId}/results/${submission.id}`,
  }));

  const details = [
    { label: t("fields.phoneNumber"), value: user.phoneNumber },
    { label: t("fields.dateOfBirth"), value: user.dateOfBirth },
    { label: t("fields.department"), value: user.department },
    { label: t("fields.position"), value: user.position },
    {
      label: t("fields.registeredAt"),
      value: format.dateTime(user.createdAt, { dateStyle: "medium" }),
    },
  ];

  const history = (title: string, items: HistoryItem[]) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("nothingYet")}</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="w-full py-2 rounded-md hover:bg-accent flex items-center justify-between gap-4"
          >
            <div className="flex flex-col">
              <span className="font-bold">{item.name}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {format.dateTime(item.date, { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={item.href}>{t("viewResult")}</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full p-10 flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-normal">{t("title")}</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <UserAvatar user={user} className="w-16 h-16" />
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">{formatFullName(user)}</CardTitle>
              <CardDescription>{formatWorkInfo(user)}</CardDescription>
              <div>
                <GroupBadge group={user.group} />
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/summary/${user.id}`}>{t("openReport")}</Link>
            </Button>
            <EditUserDialog user={user} />
          </div>
        </CardHeader>

        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm font-medium">
            {details.map((detail) => (
              <div key={detail.label} className="contents">
                <dt className="text-muted-foreground">{detail.label}</dt>
                <dd className="text-right">{detail.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {history(t("formsTaken"), formHistory)}
      {history(t("testsTaken"), testHistory)}
    </div>
  );
}
