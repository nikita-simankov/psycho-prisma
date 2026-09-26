import { findFormById } from "@/actions/form/find-form-by-id-action";
import { SendInRound } from "@/components/rounds/send-in-round";
import { PageHeader } from "@/components/page-header";
import { CopyInstrumentButton } from "@/components/studio/studio-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/page-templates";
import { ensureMember } from "@/utils/authentication";
import { planHasFeature } from "@/utils/billing";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { canEdit } from "@/utils/studio-access";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Question = { id: number; text: string; type: string; choices?: { id: number; text: string }[] };

export default async function FormPage(props: { params: Promise<{ formId: string }> }) {
  const params = await props.params;
  const base = await organizationBase();
  const t = await getTranslations("dashboard.forms");
  const studio = await getTranslations("studio");
  const respondent = await getTranslations("respondent");
  const common = await getTranslations("common");
  const context = await ensureMember("viewDashboard");
  const form = await findFormById(params.formId);

  if (!form) {
    notFound();
  }

  const editable = canEdit(context, form);
  const copyable = form.organizationId === null && can(context.membership.role, "manageLibrary") && (await planHasFeature(context.organization.id, "studio"));
  const questions = JSON.parse(form.questions) as Question[];

  return (
    <>
      <PageHeader
        title={form.name}
        back={{ href: `${base}/forms`, label: t("back") }}
        actions={
          <>
            {editable && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`${base}/forms/${form.id}/versions`}>{studio("versions.title")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`${base}/forms/${form.id}/edit`}>{common("edit")}</Link>
                </Button>
              </>
            )}
            {copyable && <CopyInstrumentButton kind="form" id={form.id} />}
            {!form.adminOnly && can(context.membership.role, "manageRounds") && <SendInRound href={`${base}/rounds/new?form=${form.id}`} />}
            {form.adminOnly && (
              <Button variant="outline" asChild>
                <Link href={`${base}/forms/${form.id}/run`}>{t("run")}</Link>
              </Button>
            )}
            <Button asChild>
              <Link href={`${base}/forms/${form.id}/results`}>{t("results")}</Link>
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="secondary">{respondent("questionCount", { count: questions.length })}</Badge>
        <Badge variant="secondary">{common("minutes", { count: form.ttc })}</Badge>
        {form.adminOnly && <Badge variant="secondary">{t("adminOnly")}</Badge>}
        {editable && <Badge variant="outline">{studio("versions.version", { version: form.version })}</Badge>}
        {editable && form.draft && <Badge variant="outline">{studio("drafts.unpublishedChanges")}</Badge>}
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        {form.description && (
          <Section title={studio("details.description")}>
            <p className="max-w-[68ch] whitespace-pre-line leading-relaxed">{form.description}</p>
          </Section>
        )}
        <Section title={t("questions")} className={form.description ? "" : "lg:col-span-2"}>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
              {questions.map((question) => (
                <li key={question.id}>
                  {question.text}
                  {question.type === "Text" && <span className="ml-2 text-xs text-muted-foreground">{studio("questions.types.Text")}</span>}
                </li>
              ))}
            </ol>
        </Section>
      </div>
    </>
  );
}
