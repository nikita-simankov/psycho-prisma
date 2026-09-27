import { getTranslations } from "next-intl/server";
import { loadSettings } from "../load-settings";
import { SettingsForm } from "../settings-form";
import { DigestPreview } from "./digest-preview";

export async function generateMetadata() {
  const t = await getTranslations("settings.sections");
  return { title: t("wellbeing") };
}

// Early-warning rules and the weekly leadership digest, with a preview of this week's email.
export default async function Page() {
  const { initial, tests, ruleTests } = await loadSettings();
  return (
    <div className="flex flex-col gap-10">
      <SettingsForm initial={initial} tests={tests} ruleTests={ruleTests} parts={["warnings", "digest"]} />
      <DigestPreview />
    </div>
  );
}
