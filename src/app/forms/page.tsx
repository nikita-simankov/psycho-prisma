import { findAllForms } from "@/actions/form/find-all-forms-action";
import { CatalogPage } from "@/components/catalog-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("respondent");
  return { title: t("forms") };
}

export default async function Page({ searchParams }: { searchParams: { done?: string } }) {
  const forms = await findAllForms();

  return (
    <CatalogPage
      kind="form"
      saved={searchParams.done === "1"}
      items={forms
        .filter((form) => !form.adminOnly)
        .map((form) => ({
          id: form.id,
          name: form.name,
          categories: form.categories.map(({ id, name }) => ({ id, name })),
          questionCount: JSON.parse(form.questions).length,
          minutes: form.ttc,
        }))}
    />
  );
}
