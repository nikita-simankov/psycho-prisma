import { findUserById } from "@/actions/user/find-user-by-id-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { prisma } from "@/utils/database";
import Link from "next/link";
import EditUserDialog from "./components/edit-user-dialog";

type PathParams = {
  params: {
    userId: string;
  };
};

export default async function UserProfilePage({ params }: PathParams) {
  const user = await findUserById(params.userId);
  const formSubmissions = await prisma.formSubmission.findMany({
    where: {
      userId: user!.id,
    },
  });

  const testSubmissions = await prisma.testSubmission.findMany({
    where: {
      userId: user!.id,
    },
  });

  return (
    <div className="w-full h-dvh p-10 flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-normal">
        Профиль пользователя
      </h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <UserAvatar user={user!} className="w-16 h-16" />
            <div className="flex flex-col">
              <CardTitle className="text-lg">
                {user?.lastName} {user?.name} {user?.surname}
              </CardTitle>
              <CardDescription className="text-md">
                {user?.rank}, {user?.division}
              </CardDescription>
            </div>
          </div>
          <EditUserDialog user={user!} />
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <section className="flex flex-col">
            <h1 className="text-lg font-bold tracking-wider mb-1">
              Общая информация
            </h1>

            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-2 text-muted-foreground text-sm font-medium">
                <span>Номер мобильного телефона</span>
              </div>
              <div className="flex flex-col gap-2 text-sm font-medium text-right">
                <span>{user?.phoneNumber}</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col">
            <h1 className="text-lg font-bold tracking-wider mb-1">
              Служебная информация
            </h1>

            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-2 text-muted-foreground text-sm font-medium">
                <span>Звание</span>
                <span>Подразделение</span>
                <span>Кем призван</span>
                <span>Вид службы</span>
                <span>Период службы</span>
              </div>
              <div className="flex flex-col gap-2 text-sm font-medium text-right">
                <span>{user?.rank}</span>
                <span>{user?.division}</span>
                <span>{user?.recruitedBy}</span>
                <span>{user?.servingKind}</span>
                <span>{user?.servingPeriod}</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col">
            <h1 className="text-lg font-bold tracking-wider mb-1">
              Информация о месте жительства
            </h1>

            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-2 text-muted-foreground text-sm font-medium">
                <span>Область</span>
                <span>Город</span>
                <span>Улица</span>
                <span>Номер дома</span>
                <span>Номер квартиры</span>
              </div>
              <div className="flex flex-col gap-2 text-sm font-medium text-right">
                <span>{user?.region}</span>
                <span>{user?.city}</span>
                <span>{user?.address}</span>
                <span>{user?.building}</span>
                <span>{user?.appartment}</span>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Пройденные анкеты</CardTitle>
        </CardHeader>
        <CardContent>
          {formSubmissions.map(async (submission) => {
            const form = await prisma.form.findFirst({
              where: {
                id: submission.formId,
              },
            });

            return (
              <div className="w-full h-12 rounded-md hover:bg-accent flex items-center justify-between">
                <div className="flex flex-row gap-2">
                  <span className="flex flex-col">
                    <h1 className="text-black dark:text-white font-bold text-md tracking-wide">
                      {form?.name}
                    </h1>
                    <span className="text-sm font-medium text-muted-foreground">
                      {submission.createdAt.toLocaleString()}
                    </span>
                  </span>
                </div>
                <Button size="sm" variant="outline">
                  <Link
                    href={
                      "/dashboard/forms/" +
                      submission.formId +
                      "/results/" +
                      submission.id
                    }
                  >
                    Смотреть результат
                  </Link>
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Пройденные методики</CardTitle>
        </CardHeader>
        <CardContent>
          {testSubmissions.map(async (submission) => {
            const test = await prisma.test.findFirst({
              where: {
                id: submission.testId,
              },
            });

            return (
              <div className="w-full h-12 rounded-md hover:bg-accent flex items-center justify-between">
                <div className="flex flex-row gap-2">
                  <span className="flex flex-col">
                    <h1 className="text-black dark:text-white font-bold text-md tracking-wide">
                      {test?.name}
                    </h1>
                    <span className="text-sm font-medium text-muted-foreground">
                      {submission.createdAt.toLocaleString()}
                    </span>
                  </span>
                </div>
                <Button size="sm" variant="outline">
                  <Link
                    href={
                      "/dashboard/tests/" +
                      submission.testId +
                      "/results/" +
                      submission.id
                    }
                  >
                    Смотреть результат
                  </Link>
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
