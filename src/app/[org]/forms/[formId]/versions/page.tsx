import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { VersionHistory } from "@/components/studio/version-history";
import { organizationBase } from "@/utils/organization-path";
import { loadEditableForm } from "@/utils/studio-access";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("studio.versions");
  return { title: t("title") };
}

export default async function VersionsPage(props: { params: Promise<{ formId: string }> }) {
  const params = await props.params;
  const { row } = await loadEditableForm(params.formId);
  const t = await getTranslations("studio");
  const common = await getTranslations("common");
  const base = await organizationBase();

  return (
    <>
      <PageHeader
        title={t("versions.title")}
        crumb={row.name}
        description={t("versions.description")}
        back={{ href: `${base}/forms/${row.id}`, label: common("back") }}
        actions={
          <Button asChild>
            <Link href={`${base}/forms/${row.id}/edit`}>{common("edit")}</Link>
          </Button>
        }
      />
      <VersionHistory kind="form" instrument={{ ...row, organizationId: row.organizationId! }} />
    </>
  );
}
