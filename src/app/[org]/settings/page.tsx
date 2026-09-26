import { findAllUsers } from "@/actions/user/find-all-users-action";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import { loadSettings } from "./load-settings";
import { OwnerControls } from "./owner-controls";
import { SettingsForm } from "./settings-form";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("settings") };
}

// General: the organization's name, and for the owner, handing it over or closing it.
export default async function SettingsPage() {
  const { context, initial, tests } = await loadSettings();
  const owner = context.membership.role === "owner";
  const members = owner ? await findAllUsers() : [];

  return (
    <div className="flex flex-col gap-12">
      <SettingsForm initial={initial} tests={tests} parts={["general"]} />
      {owner && (
        <OwnerControls
          organizationName={context.organization.name}
          candidates={members
            .filter((member) => member.id !== context.user.id && member.role !== "owner")
            .map((member) => ({ id: member.id, name: formatFullName(member) }))}
        />
      )}
    </div>
  );
}
