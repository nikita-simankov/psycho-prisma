import { findAllForms } from "@/actions/form/find-all-forms-action";
import { Catalog } from "@/components/catalog";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("respondent");
  return { title: t("forms") };
}

export default async function Page() {
  const t = await getTranslations("respondent");
  const forms = await findAllForms();

  return (
    <div className="flex flex-col gap-4 items-center p-6">
      <h1 className="text-2xl font-bold">{t("forms")}</h1>
      <Separator />
      <Catalog items={forms.filter((form) => !form.adminOnly)} hrefPrefix="/forms/" />
    </div>
  );
}
