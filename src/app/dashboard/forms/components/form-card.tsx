import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@prisma/client";
import Link from "next/link";

type Properties = {
  form: Form;
};

export function FormCard({ form }: Properties) {
  const t = useTranslations("dashboard.forms");
  return (
    <Card className="flex flex-col justify-between h-64">
      <CardHeader>
        <CardTitle className="text-lg">
          {form.adminOnly && (
            <>
              <Badge variant="outline" className="mr-2">
                {t("adminOnly")}
              </Badge>
            </>
          )}
          {form.name}
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardFooter className="grid grid-cols-2 gap-2">
        {form.adminOnly ? (
          <>
            <Link href={"/dashboard/forms/" + form.id + "/run"}>
              <Button className="w-full">{t("run")}</Button>
            </Link>
            <Link href={"/dashboard/forms/" + form.id + "/results"}>
              <Button className="w-full">{t("results")}</Button>
            </Link>
          </>
        ) : (
          <Link
            href={"/dashboard/forms/" + form.id + "/results"}
            className="col-span-2"
          >
            <Button className="w-full">{t("results")}</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
