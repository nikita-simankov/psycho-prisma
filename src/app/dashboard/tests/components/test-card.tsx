import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TestQuestion } from "@/utils/constants";
import { Test } from "@prisma/client";
import { Calendar, CircleHelp, Clock } from "lucide-react";
import Link from "next/link";

type Properties = {
  test: Test;
};

export const TestCard: React.FC<Properties> = ({ test }) => {
  const questions = JSON.parse(test.questions) as TestQuestion[];

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{test.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-muted-foreground">
        <div className="flex flex-row items-center gap-1">
          <Calendar className="w-[1rem] h-[1rem]" />
          <span>Создано {test.createdAt.toLocaleString()}</span>
        </div>
        <div className="flex flex-row items-center gap-1">
          <CircleHelp className="w-[1rem] h-[1rem]" />
          <span>Вопросов: {questions.length} шт.</span>
        </div>
        <div className="flex flex-row items-center gap-1">
          <Clock className="w-[1rem] h-[1rem]" />
          <span>Время: {Math.round(questions.length * 0.3)} мин.</span>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-1">
        <Link href={"/dashboard/tests/" + test.id}>
          <Button className="w-full">Запустить</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
