import { organizationBase } from "@/utils/organization-path";
import { redirect } from "next/navigation";

// Saved reports are now versions on each person's report.
export default async function ArchivePage() {
  redirect(`${await organizationBase()}/reports`);
}
