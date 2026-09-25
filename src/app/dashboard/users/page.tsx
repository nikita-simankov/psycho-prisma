import { findAllUsers } from "@/actions/user/find-all-users-action";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";
import { UsersTable } from "./components/users-table";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("people") };
}

export default async function Page() {
  const t = await getTranslations("people");
  const users = await findAllUsers();

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">{t("title")}</h1>
      <Separator />
      <UsersTable users={users} />
    </div>
  );
}
