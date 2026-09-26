import { findTestById } from "@/actions/test/find-test-by-id-action";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/page-templates";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";
import { CopyInstrumentButton } from "@/components/studio/studio-buttons";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { canEdit } from "@/utils/studio-access";

type PathParams = {
  params: Promise<{
    testId: string;
  }>;
};

export default async function TestPage(props: PathParams) {
  const params = await props.params;
  const base = await organizationBase();
  const t = await getTranslations("dashboard.tests");
  const respondent = await getTranslations("respondent");
  const common = await getTranslations("common");
  const studio = await getTranslations("studio");
  const context = await ensureMember();
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  const editable = canEdit(context, test);
  // Shared library tests are copied to be changed; the organization's own are edited in place.
  const copyable = test.organizationId === null && can(context.membership.role, "manageLibrary") && (!test.sensitive || can(context.membership.role, "viewSensitive"));

  return (
    <>
      <PageHeader
        title={test.name}
        back={{ href: `${base}/tests`, label: t("back") }}
        actions={
          <>
            {editable && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`${base}/tests/${test.id}/versions`}>{studio("versions.title")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`${base}/tests/${test.id}/edit`}>{common("edit")}</Link>
                </Button>
              </>
            )}
            {copyable && <CopyInstrumentButton kind="test" id={test.id} />}
            <Button variant="outline" asChild>
              <Link href={`/tests/${test.id}`}>{t("tryIt")}</Link>
            </Button>
            <Button asChild>
              <Link href={`${base}/tests/${test.id}/results`}>{t("results")}</Link>
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="secondary">{respondent("questionCount", { count: JSON.parse(test.questions).length })}</Badge>
        <Badge variant="secondary">{common("minutes", { count: test.ttc })}</Badge>
        <Badge variant="secondary">{t(`strategies.${test.strategy}` as "strategies.grade")}</Badge>
        {editable && <Badge variant="outline">{studio("versions.version", { version: test.version })}</Badge>}
        {editable && test.draft && <Badge variant="outline">{studio("drafts.unpublishedChanges")}</Badge>}
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        {test.description && (
          <Section title={t("about")}>
            <p className="max-w-[68ch] whitespace-pre-line leading-relaxed">{test.description}</p>
          </Section>
        )}
        {test.instruction && (
          <Section title={t("instruction")}>
            <p className="max-w-[68ch] whitespace-pre-line leading-relaxed">{test.instruction}</p>
          </Section>
        )}
      </div>
    </>
  );
}
