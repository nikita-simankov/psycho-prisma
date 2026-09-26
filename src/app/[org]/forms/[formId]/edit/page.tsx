import { FormEditor } from "@/components/studio/instrument-editors";
import { PageHeader } from "@/components/page-header";
import { organizationBase } from "@/utils/organization-path";
import { loadEditableForm } from "@/utils/studio-access";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: t("editForm") };
}

export default async function EditFormPage({ params }: { params: { formId: string } }) {
  const { row, content } = await loadEditableForm(params.formId);
  const t = await getTranslations("studio");
  const common = await getTranslations("common");
  const base = organizationBase();
  const backHref = row.version === 0 ? `${base}/forms` : `${base}/forms/${row.id}`;

  return (
    <>
      <PageHeader title={t("editForm")} crumb={row.name} back={{ href: backHref, label: common("back") }} className="mb-2" />
      <FormEditor id={row.id} version={row.version} hasDraft={Boolean(row.draft)} backHref={`${base}/forms/${row.id}`} initial={content} />
    </>
  );
}
