import { findAllTests } from "@/actions/test/find-all-tests-action";
import { Catalog } from "@/components/catalog";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("respondent");
  return { title: t("tests") };
}

export default async function Page() {
  const t = await getTranslations("respondent");
  const tests = await findAllTests();

  return (
    <div className="flex flex-col gap-4 items-center p-6">
      <h1 className="text-2xl font-bold">{t("tests")}</h1>
      <Separator />
      <Catalog items={tests} hrefPrefix="/tests/" />
    </div>
  );
}
