import { InstrumentCard } from "@/components/instrument-card";
import { Button } from "@/components/ui/button";
import { Category, Test } from "@prisma/client";
import { useTranslations } from "next-intl";
import Link from "next/link";

type Properties = {
  // The organization path, "/acme".
  base: string;
  test: Test & { categories?: Category[] };
};

export function TestCard({ test, base }: Properties) {
  const t = useTranslations("dashboard.tests");
  const common = useTranslations("common");
  const respondent = useTranslations("respondent");
  const questionCount = (JSON.parse(test.questions) as unknown[]).length;

  return (
    <InstrumentCard
      kind="test"
      name={test.name}
      badges={test.categories?.map((category) => category.name)}
      meta={[respondent("questionCount", { count: questionCount }), common("minutes", { count: test.ttc })]}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link href={`${base}/tests/${test.id}`}>{common("open")}</Link>
          </Button>
          <Button asChild>
            <Link href={`${base}/tests/${test.id}/results`}>{t("results")}</Link>
          </Button>
        </>
      }
    />
  );
}
