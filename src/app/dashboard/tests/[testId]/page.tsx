import { findTestById } from "@/actions/test/find-test-by-id-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  return (
    <div className="p-12">
      <Card>
        <CardHeader>
          <CardTitle>{test.name}</CardTitle>
          <CardDescription>
            {respondent("questionCount", { count: JSON.parse(test.questions).length })}
            {" · "}
            {t(`strategies.${test.strategy}` as "strategies.grade")}
          </CardDescription>
        </CardHeader>
        {test.description && (
          <CardContent className="whitespace-pre-line">{test.description}</CardContent>
        )}
        <CardFooter className="gap-2">
          <Button asChild>
            <Link href={`/dashboard/tests/${test.id}/results`}>{t("results")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/tests/${test.id}`}>{t("tryIt")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
