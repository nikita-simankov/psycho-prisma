import { findUserById } from "@/actions/user/find-user-by-id-action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Params {
  params: {
    id: string;
  };
}

export default async function Page({ params }: Params) {
  const user = await findUserById(params.id);
  const archiveEntry = await prisma.userSummary.findFirst({
    where: {
      userId: user?.id,
    },
  });

  return (
    <div className="p-12 max-w-6xl w-full mx-auto flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <UserAvatar user={user!} className="w-20 h-20" />
            <div className="w-full flex flex-col gap-2">
              <CardTitle>
                {user?.lastName} {user?.name} {user?.surname}
              </CardTitle>
              <CardDescription>
                {user?.rank}, {user?.division}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" asChild>
              <Link href={"/dashboard/summary/" + user!.id}>
                Смотреть характеристику
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={"/dashboard/users/" + user!.id}>
                Смотреть профиль
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Биографические данные военнослужащего</CardTitle>
        </CardHeader>
        <CardContent>{archiveEntry?.additionalNotes}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Заключение войскового психолога</CardTitle>
        </CardHeader>
        <CardContent>{archiveEntry?.verdict}</CardContent>
      </Card>
    </div>
  );
}
