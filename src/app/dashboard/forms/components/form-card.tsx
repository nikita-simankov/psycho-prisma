import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormQuestion, TestQuestion } from "@/utils/constants";
import { Form } from "@prisma/client";
import Link from "next/link";

type Properties = {
  form: Form;
};

export const FormCard: React.FC<Properties> = ({ form }) => {
  const questions = JSON.parse(form.questions) as FormQuestion[];

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{form.name}</CardTitle>
        <CardDescription>
          Количество вопросов - {questions.length} шт.
        </CardDescription>
      </CardHeader>
      <CardFooter className="grid grid-cols-1">
        <Link href={"/dashboard/forms/" + form.id + "/results"}>
          <Button className="w-full">Смотреть результаты</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
