import { findFormById } from "@/actions/form/find-form-by-id-action";
import { IntroCard } from "@/components/intro-card";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function Page({ params }: PathParams) {
  const form = await findFormById(params.formId);

  if (!form) {
    notFound();
  }

  return (
    <IntroCard
      name={form.name}
      description={form.description}
      questionCount={JSON.parse(form.questions).length}
      startHref={`/forms/${form.id}/run`}
    />
  );
}
