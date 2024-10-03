import { Separator } from "@/components/ui/separator";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { UsersSummaryTable } from "./components/users-summary-table";

export default async function Page() {
  const users = await findAllUsers();

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">
        Список личного состава
      </h1>
      <Separator />
      <UsersSummaryTable users={users!} />
    </div>
  );
}
