import { PageHeader } from "@/components/page-header";
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
  const forms = await findAllForms();

  return (
    <>
      <PageHeader title={t("title")} description={t("pageDescription")} actions={<CreateFormDialog />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {forms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </div>
    </>
  );
}
