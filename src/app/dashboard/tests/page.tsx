import { findAllTests } from "@/actions/test/find-all-tests-action";
import { CreateTestDialog } from "./components/create-test-dialog";
import { TestCard } from "./components/test-card";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  const tests = await findAllTests();

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">
        Список тестовых методик
      </h1>
      <Separator />
      <div className="grid grid-cols-3 gap-4">
        <CreateTestDialog />
        {tests.map((test) => (
          <TestCard test={test} />
        ))}
      </div>
    </div>
  );
}
