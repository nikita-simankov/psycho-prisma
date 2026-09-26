import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { getTranslations } from "next-intl/server";
import { SettingsNav } from "./settings-nav";

// Settings are split into sections with their links beside the page.
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("settings");
  const { membership } = await ensureMember("manageSettings");
  const base = `${await organizationBase()}/settings`;
  const sections = [
    { href: base, label: t("sections.general") },
    { href: `${base}/members`, label: t("sections.members") },
    { href: `${base}/privacy`, label: t("sections.privacy") },
    { href: `${base}/fields`, label: t("sections.fields") },
    ...(can(membership.role, "viewAudit") ? [{ href: `${base}/audit`, label: t("sections.audit") }] : []),
    { href: `${base}/billing`, label: t("sections.billing") },
  ];

  return (
    <>
      {/* No crumb of its own: the path already names the section being viewed. */}
      <PageHeader title={t("title")} description={t("description")} crumb="" />
      <SettingsNav sections={sections} label={t("sectionsLabel")}>
        {children}
      </SettingsNav>
    </>
  );
}
