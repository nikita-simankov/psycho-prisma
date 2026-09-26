import { getTranslations } from "next-intl/server";
import { loadSettings } from "../load-settings";
import { SettingsForm } from "../settings-form";

export async function generateMetadata() {
  const t = await getTranslations("settings.sections");
  return { title: t("fields") };
}

export default async function Page() {
  const { initial, tests } = await loadSettings();
  return <SettingsForm initial={initial} tests={tests} parts={["fields"]} />;
}
