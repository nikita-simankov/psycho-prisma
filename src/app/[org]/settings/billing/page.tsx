import { Section } from "@/components/page-templates";
import { Stat } from "@/components/ui/stat";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("settings.sections");
  return { title: t("billing") };
}

// Plan and billing. Until paid plans launch, every organization has all features; this shows the
// usage that plans will be priced on (people who submitted an assessment in the last twelve months).
export default async function BillingPage() {
  const t = await getTranslations("settings.billing");
  const { organization } = await ensureMember("manageSettings");
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const [tests, forms] = await Promise.all([
    prisma.testSubmission.findMany({ where: { organizationId: organization.id, createdAt: { gte: yearAgo } }, select: { userId: true }, distinct: ["userId"] }),
    prisma.formSubmission.findMany({ where: { organizationId: organization.id, createdAt: { gte: yearAgo } }, select: { userId: true }, distinct: ["userId"] }),
  ]);
  const respondents = new Set([...tests, ...forms].map((submission) => submission.userId)).size;

  return (
    <div className="flex max-w-2xl flex-col gap-12">
      <Section title={t("plan")} description={t("planText")}>
        <div className="grid grid-cols-2 border-y">
          <div className="py-5 pr-5">
            <Stat label={t("current")} value={t("earlyAccess")} hint={t("earlyAccessHint")} />
          </div>
          <div className="border-l py-5 pl-5">
            <Stat label={t("respondents")} value={respondents} hint={t("respondentsHint")} />
          </div>
        </div>
      </Section>
      <Section title={t("invoices")}>
        <p className="text-sm text-muted-foreground">{t("invoicesEmpty")}</p>
      </Section>
    </div>
  );
}
