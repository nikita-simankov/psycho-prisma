import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { VersionHistory } from "@/components/studio/version-history";
import { organizationBase } from "@/utils/organization-path";
import { loadEditableTest } from "@/utils/studio-access";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("studio.versions");
  return { title: t("title") };
}

export default async function VersionsPage({ params }: { params: { testId: string } }) {
  const { row } = await loadEditableTest(params.testId);
  const t = await getTranslations("studio");
  const common = await getTranslations("common");
  const base = organizationBase();

  return (
    <>
      <PageHeader
        title={t("versions.title")}
        crumb={row.name}
        description={t("versions.description")}
        back={{ href: `${base}/tests/${row.id}`, label: common("back") }}
        actions={
          <Button asChild>
            <Link href={`${base}/tests/${row.id}/edit`}>{common("edit")}</Link>
          </Button>
        }
      />
      <VersionHistory kind="test" instrument={{ ...row, organizationId: row.organizationId! }} />
    </>
  );
}
