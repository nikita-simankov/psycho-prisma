import { PrivacyNotice } from "@/components/privacy-notice";
import { Card } from "@/components/ui/card";
import Logo from "@/components/ui/logo";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ConsentActions } from "./consent-actions";

export async function generateMetadata() {
  const t = await getTranslations("consent");
  return { title: t("metaTitle") };
}

export default async function ConsentPage() {
  const { membership, organization } = await ensureMember();
  const staff = can(membership.role, "viewDashboard");

  if (membership.consentedAt || staff) {
    redirect(staff ? "/dashboard" : "/forms");
  }

  const t = await getTranslations("consent");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-14">
      <Logo withText />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("text", { organization: organization.name })}</p>
      </div>
      <Card className="p-5 sm:p-6">
        <PrivacyNotice organization={organization.name} contact={organization.privacyContact} />
      </Card>
      <ConsentActions />
    </main>
  );
}
