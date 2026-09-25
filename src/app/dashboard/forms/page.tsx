import { getTranslations } from "next-intl/server";
import { FormCard } from "./components/form-card";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { CreateFormDialog } from "./components/create-form-dialog";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("forms") };
}

export default async function Page() {
  const t = await getTranslations("dashboard.forms");
  const forms = await findAllForms();

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">{t("title")}</h1>
      <Separator />
      <div className="grid grid-cols-3 gap-4">
        <CreateFormDialog />
        {forms.map((form) => (
          <FormCard key={form.id} form={form} />
        ))}
      </div>
    </div>
  );
}
