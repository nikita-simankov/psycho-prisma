import { TestEditor } from "@/components/studio/instrument-editors";
import { PageHeader } from "@/components/page-header";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { loadEditableTest } from "@/utils/studio-access";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: t("editTest") };
}

export default async function EditTestPage({ params }: { params: { testId: string } }) {
  const { context, row, content } = await loadEditableTest(params.testId);
  const t = await getTranslations("studio");
  const common = await getTranslations("common");
  const base = organizationBase();
  const backHref = row.version === 0 ? `${base}/tests` : `${base}/tests/${row.id}`;

  return (
    <>
      <PageHeader title={t("editTest")} crumb={row.name} back={{ href: backHref, label: common("back") }} className="mb-2" />
      <TestEditor
        id={row.id}
        version={row.version}
        hasDraft={Boolean(row.draft)}
        backHref={`${base}/tests/${row.id}`}
        initial={content}
        settings={{ sensitive: row.sensitive, retestDays: row.retestDays }}
        canMarkSensitive={can(context.membership.role, "viewSensitive")}
      />
    </>
  );
}
