import { InstrumentCard } from "@/components/instrument-card";
import { Button } from "@/components/ui/button";
import { Category, Form } from "@prisma/client";
import { useTranslations } from "next-intl";
import Link from "next/link";

type Properties = {
  form: Form & { categories?: Category[] };
};

export function FormCard({ form }: Properties) {
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
        form.adminOnly ? (
          <>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/forms/${form.id}/run`}>{t("run")}</Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/forms/${form.id}/results`}>{t("results")}</Link>
            </Button>
          </>
        ) : (
          <Button asChild className="col-span-2">
            <Link href={`/dashboard/forms/${form.id}/results`}>{t("results")}</Link>
          </Button>
        )
      }
    />
  );
}
