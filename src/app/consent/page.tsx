import { PrivacyNotice } from "@/components/privacy-notice";
import { DataPromise } from "@/components/data-promise";
import { Card } from "@/components/ui/card";
import { OrganizationMark } from "@/components/organization-mark";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ConsentActions } from "./consent-actions";

export async function generateMetadata() {
  const t = await getTranslations("consent");
  return { title: t("metaTitle") };
}

// Only the app's own respondent pages, never another site.
function safeNext(value: string | undefined) {
  return value && /^\/(tests|forms)\/[\w-]+\?assignment=[\w-]+$/.test(value) ? value : "/assessments";
}

export default async function ConsentPage(props: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await props.searchParams).next);
  const { membership, organization } = await ensureMember();
  const staff = can(membership.role, "viewDashboard");

  if (membership.consentedAt || staff) {
    redirect(staff ? `/${organization.slug}` : next);
  }

  const t = await getTranslations("consent");

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-14">
      <div className="flex items-center gap-2.5">
        <OrganizationMark name={organization.name} className="size-7" />
        <span className="font-medium">{organization.name}</span>
      </div>
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-medium leading-[1.1]">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("text", { organization: organization.name })}</p>
      </header>
      <Card className="p-5 sm:p-8">
        <PrivacyNotice organization={organization.name} contact={organization.privacyContact} />
      </Card>
      <DataPromise organizationId={organization.id} />
      <ConsentActions next={next} />
    </main>
  );
}
