import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Test } from "@prisma/client";
import { Calendar, CircleHelp, Clock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

type Properties = {
  test: Test;
};

// Rough duration: about 20 seconds per question.
const MINUTES_PER_QUESTION = 0.3;

export function TestCard({ test }: Properties) {
  const t = useTranslations("dashboard.tests");
  const common = useTranslations("common");
  const respondent = useTranslations("respondent");
  const format = useFormatter();
  const questionCount = (JSON.parse(test.questions) as unknown[]).length;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{test.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-muted-foreground">
        <div className="flex flex-row items-center gap-1">
          <Calendar className="w-[1rem] h-[1rem]" />
          <span>
            {t("createdAt", { date: format.dateTime(test.createdAt, { dateStyle: "medium" }) })}
          </span>
        </div>
        <div className="flex flex-row items-center gap-1">
          <CircleHelp className="w-[1rem] h-[1rem]" />
          <span>{respondent("questionCount", { count: questionCount })}</span>
        </div>
        <div className="flex flex-row items-center gap-1">
          <Clock className="w-[1rem] h-[1rem]" />
          <span>
            {common("minutes", { count: Math.max(1, Math.round(questionCount * MINUTES_PER_QUESTION)) })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/tests/${test.id}`}>{common("open")}</Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/tests/${test.id}/results`}>{t("results")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
