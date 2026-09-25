import { findTestById } from "@/actions/test/find-test-by-id-action";
import { IntroCard } from "@/components/intro-card";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    testId: string;
  };
};

export default async function TestPage({ params }: PathParams) {
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  return (
    <IntroCard
      name={test.name}
      description={test.description}
      instruction={test.instruction}
      questionCount={JSON.parse(test.questions).length}
      minutes={test.ttc}
      backHref="/tests"
      startHref={`/tests/${test.id}/run`}
    />
  );
}
