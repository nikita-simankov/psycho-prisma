import { findAllUsers } from "@/actions/user/find-all-users-action";
import { UsersTable } from "./components/users-table";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  const users = await findAllUsers();

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">
        Список личного состава
      </h1>
      <Separator />
      <UsersTable users={users!} />
    </div>
  );
}
