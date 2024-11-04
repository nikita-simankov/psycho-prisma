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
import { TestQuestion } from "@/utils/constants";
import Link from "next/link";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function TestPage({ params }: PathParams) {
  const test = await findTestById(params.testId);
  const questions = JSON.parse(test?.questions!) as TestQuestion[];

  return (
    <div className="p-12">
      <Card>
        <CardHeader>
          <CardTitle>{test?.name}</CardTitle>
          <CardDescription>
            Количество вопросов: {questions.length} шт.
          </CardDescription>
        </CardHeader>
        <CardContent>{test?.description}</CardContent>
        <CardFooter>
          <Link href={"/tests/" + test?.id + "/run"}>
            <Button>Начать</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
