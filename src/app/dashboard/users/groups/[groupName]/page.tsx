import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import Link from "next/link";

type PathParams = {
  params: {
    groupName: string;
  };
};

export default async function GroupsPage({ params }: PathParams) {
  const users = await findAllUsers();
  const filteredUsers = users.filter(
    (user) => user.group === decodeURI(params.groupName)
  );

  return (
    <div className="p-12">
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>{decodeURI(params.groupName)}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.map((user) => (
            <div className="px-4 w-full h-16 hover:bg-accent transition-colors flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-2">
                <UserAvatar user={user} />
                <span className="text-sm font-medium tracking-wider">
                  {user.lastName} {user.name} {user.surname}
                </span>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={"/dashboard/users/" + user.id}>
                  Смотреть профиль
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
