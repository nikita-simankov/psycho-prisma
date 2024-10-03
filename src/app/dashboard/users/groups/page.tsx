import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "@prisma/client";
import Link from "next/link";

export default async function DashboardPage() {
  const users = await findAllUsers();
  const groups: Map<string, User[]> = new Map();

  users.forEach((user) => {
    if (groups.get(user.group) !== undefined) {
      groups.set(user.group, [...groups.get(user.group)!, user]);
    } else {
      groups.set(user.group, [user]);
    }
  });

  const keys = Array.from(groups.keys());

  return (
    <div className="p-12 gap-4 grid grid-cols-4">
      {keys.map((key) => (
        <Card>
          <CardHeader>
            <CardTitle>{key}</CardTitle>
          </CardHeader>
          <CardContent>
            В группе "{key}" состоит {groups.get(key)!.length} военнослужащих
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={"/dashboard/users/groups/" + encodeURI(key)}>
                Подробнее
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
