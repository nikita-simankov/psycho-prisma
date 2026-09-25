import { findTestById } from "@/actions/test/find-test-by-id-action";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function TestPage({ params }: PathParams) {
  const t = await getTranslations("dashboard.tests");
  const respondent = await getTranslations("respondent");
  const common = await getTranslations("common");
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={test.name}
        back={{ href: "/dashboard/tests", label: t("back") }}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/tests/${test.id}`}>{t("tryIt")}</Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/tests/${test.id}/results`}>{t("results")}</Link>
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant="secondary">{respondent("questionCount", { count: JSON.parse(test.questions).length })}</Badge>
        <Badge variant="secondary">{common("minutes", { count: test.ttc })}</Badge>
        <Badge variant="secondary">{t(`strategies.${test.strategy}` as "strategies.grade")}</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {test.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("about")}</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-muted-foreground">{test.description}</CardContent>
          </Card>
        )}
        {test.instruction && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("instruction")}</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-muted-foreground">{test.instruction}</CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
