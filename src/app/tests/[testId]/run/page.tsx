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
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <TestRunner test={test} questions={questions} />
    </div>
  );
}
