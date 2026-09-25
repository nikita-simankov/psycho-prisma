import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { getTranslations } from "next-intl/server";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { formatFullName } from "@/utils/user";
import { OwnerControls } from "./owner-controls";
import { SettingsForm } from "./settings-form";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const { organization, membership, user } = await ensureMember("manageSettings");
  const owner = membership.role === "owner";
  const members = owner ? await findAllUsers() : [];

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsForm
        initial={{
          name: organization.name,
          privacyContact: organization.privacyContact,
          respondentFeedback: organization.respondentFeedback,
        }}
      />
      {owner && (
        <div className="mt-6">
          <OwnerControls
            organizationName={organization.name}
            candidates={members
              .filter((member) => member.id !== user.id && member.role !== "owner")
              .map((member) => ({ id: member.id, name: formatFullName(member) }))}
          />
        </div>
      )}
    </>
  );
}
