import { FormCard } from "./components/form-card";
import { findAllForms } from "@/actions/form/find-all-forms-action";
import { CreateFormDialog } from "./components/create-form-dialog";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  const forms = await findAllForms();

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">
        Список доступных анкет
      </h1>
      <Separator />
      <div className="grid grid-cols-3 gap-4">
        <CreateFormDialog />
        {forms.map((form) => (
          <FormCard form={form} />
        ))}
      </div>
    </div>
  );
}
