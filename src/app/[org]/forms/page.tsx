import { PageHeader } from "@/components/page-header";
import { LibraryTabs } from "../components/library-tabs";
import { DraftsList } from "@/components/studio/drafts-list";
import { NewInstrumentButton } from "@/components/studio/studio-buttons";
import { ensureMember } from "@/utils/authentication";
import { getPlan } from "@/utils/billing";
import { featureLevel } from "@/utils/billing-rules";
import { can } from "@/utils/roles";
import { organizationBase } from "@/utils/organization-path";
import { findDrafts } from "@/utils/studio-access";
import { getTranslations } from "next-intl/server";
import { FormCard } from "./components/form-card";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { CreateFormDialog } from "./components/create-form-dialog";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("forms") };
}

export default async function Page() {
  const t = await getTranslations("dashboard.forms");
  const context = await ensureMember();
  const base = await organizationBase();
  const manage = can(context.membership.role, "manageLibrary");
  // Building or importing your own instruments is part of the studio feature.
  const studio = featureLevel((await getPlan(context.organization.id)).plan, "studio") === true;
  const [forms, drafts] = await Promise.all([findAllForms(), manage ? findDrafts("form", context) : []]);

  return (
    <>
      <PageHeader title={t("title")} description={t("pageDescription")} actions={
          manage && (
            <>
              {studio && <CreateFormDialog />}
              {studio && <NewInstrumentButton kind="form" />}
            </>
          )
        } />
      <LibraryTabs />
      <DraftsList kind="form" drafts={drafts} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {forms.map((form) => (
          <FormCard key={form.id} form={form} base={base} />
        ))}
      </div>
    </>
  );
}
