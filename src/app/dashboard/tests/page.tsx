import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { CreateTestDialog } from "./components/create-test-dialog";
import { TestCard } from "./components/test-card";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("tests") };
}

export default async function Page() {
  const t = await getTranslations("dashboard.tests");
  const tests = await findAllTests();

  return (
    <>
      <PageHeader title={t("title")} description={t("pageDescription")} actions={<CreateTestDialog />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tests.map((test) => (
          <TestCard key={test.id} test={test} />
        ))}
      </div>
    </>
  );
}
