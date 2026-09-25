import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { getTranslations } from "next-intl/server";
import { SettingsForm } from "./settings-form";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const { organization } = await ensureMember("manageSettings");

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
    </>
  );
}
