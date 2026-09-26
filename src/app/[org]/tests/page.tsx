import { PageHeader } from "@/components/page-header";
import { DraftsList } from "@/components/studio/drafts-list";
import { NewInstrumentButton } from "@/components/studio/studio-buttons";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { organizationBase } from "@/utils/organization-path";
import { findDrafts } from "@/utils/studio-access";
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
  const context = await ensureMember();
  const base = await organizationBase();
  const manage = can(context.membership.role, "manageLibrary");
  const [tests, drafts] = await Promise.all([findAllTests(), manage ? findDrafts("test", context) : []]);

  return (
    <>
      <PageHeader title={t("title")} description={t("pageDescription")} actions={
          manage && (
            <>
              <CreateTestDialog />
              <NewInstrumentButton kind="test" />
            </>
          )
        } />
      <DraftsList kind="test" drafts={drafts} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tests.map((test) => (
          <TestCard key={test.id} test={test} base={base} />
        ))}
      </div>
    </>
  );
}
