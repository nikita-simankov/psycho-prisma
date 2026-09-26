import { findAllUsers } from "@/actions/user/find-all-users-action";
import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { getTranslations } from "next-intl/server";
import { UsersTable } from "../people/components/users-table";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("reports") };
}

export default async function Page() {
  await ensureMember("viewIndividualResults");
  const t = await getTranslations("reports");
  const users = await findAllUsers();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <UsersTable users={users} mode="reports" />
    </>
  );
}
