import { getTranslations } from "next-intl/server";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { CreateTestDialog } from "./components/create-test-dialog";
import { TestCard } from "./components/test-card";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("tests") };
}

export default async function Page() {
  const t = await getTranslations("dashboard.tests");
  const tests = await findAllTests();

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">{t("title")}</h1>
      <Separator />
      <div className="grid grid-cols-3 gap-4">
        <CreateTestDialog />
        {tests.map((test) => (
          <TestCard key={test.id} test={test} />
        ))}
      </div>
    </div>
  );
}
