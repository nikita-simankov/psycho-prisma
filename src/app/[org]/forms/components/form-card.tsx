import { InstrumentCard } from "@/components/instrument-card";
import { Button } from "@/components/ui/button";
import { Category, Form } from "@prisma/client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { organizationBase } from "@/utils/organization-path";

type Properties = {
  form: Form & { categories?: Category[] };
};

export function FormCard({ form }: Properties) {
  const base = organizationBase();
  const t = useTranslations("dashboard.forms");
  const common = useTranslations("common");
  const respondent = useTranslations("respondent");
  const questionCount = (JSON.parse(form.questions) as unknown[]).length;
  const badges = [
    ...(form.adminOnly ? [t("adminOnly")] : []),
    ...(form.categories?.map((category) => category.name) ?? []),
  ];

  return (
    <InstrumentCard
      kind="form"
      name={form.name}
      badges={badges}
      meta={[respondent("questionCount", { count: questionCount }), common("minutes", { count: form.ttc })]}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href={`${base}/forms/${form.id}`}>{common("open")}</Link>
          </Button>
          <Button asChild>
            <Link href={`${base}/forms/${form.id}/results`}>{t("results")}</Link>
          </Button>
        </>
      }
    />
  );
}
