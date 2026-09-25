import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import Link from "next/link";

// Start screen shown before a questionnaire or test.
export function IntroCard({
  name,
  description,
  questionCount,
  startHref,
}: {
  name: string;
  description: string;
  questionCount: number;
  startHref: string;
}) {
  const t = useTranslations("respondent");
  const common = useTranslations("common");

  return (
    <div className="p-6 md:p-12 flex justify-center">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{t("questionCount", { count: questionCount })}</CardDescription>
        </CardHeader>
        {description && (
          <CardContent className="whitespace-pre-line">{description}</CardContent>
        )}
        <CardFooter>
          <Button asChild>
            <Link href={startHref}>{common("start")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
