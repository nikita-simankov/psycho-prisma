import { findAllTests } from "@/actions/test/find-all-tests-action";
import { CatalogPage } from "@/components/catalog-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("respondent");
  return { title: t("tests") };
}

export default async function Page({ searchParams }: { searchParams: { done?: string } }) {
  const tests = await findAllTests();

  return (
    <CatalogPage
      kind="test"
      saved={searchParams.done === "1"}
      items={tests.map((test) => ({
        id: test.id,
        name: test.name,
        categories: test.categories.map(({ id, name }) => ({ id, name })),
        questionCount: JSON.parse(test.questions).length,
        minutes: test.ttc,
      }))}
    />
  );
}
