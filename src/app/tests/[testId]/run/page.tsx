import { findTestById } from "@/actions/test/find-test-by-id-action";
import { TestQuestion } from "@/utils/constants";
import { notFound } from "next/navigation";
import { TestRunner } from "../components/test-runner";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function Page({ params }: PathParams) {
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  const questions = JSON.parse(test.questions) as TestQuestion[];

  return (
    <div className="p-6 md:p-12 flex flex-col items-center justify-center">
      <TestRunner test={test} questions={questions} />
    </div>
  );
}
