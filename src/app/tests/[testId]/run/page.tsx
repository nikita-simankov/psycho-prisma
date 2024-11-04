import { findTestById } from "@/actions/test/find-test-by-id-action";
import { TestRunner } from "../components/test-runner";
import { TestQuestion } from "@/utils/constants";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function Page({ params }: PathParams) {
  const test = await findTestById(params.testId);
  const questions = JSON.parse(test?.questions!) as TestQuestion[];

  return (
    <div className="p-12 h-full flex flex-col items-center justify-center">
      <TestRunner test={test!} questions={questions} />
    </div>
  );
}
