import { redirect } from "next/navigation";

// Questionnaires are sent in rounds and listed with everything else on /assessments.
export default function Page() {
  redirect("/assessments");
}
