import { findFormById } from "@/actions/form/find-form-by-id-action";
import { FormRunner } from "./components/form-runner";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function Page({ params }: PathParams) {
  const form = await findFormById(params.formId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form?.name}</CardTitle>
        <CardDescription>{form?.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button>
          <Link href={"/forms/" + params.formId + "/run"}>Начать</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
