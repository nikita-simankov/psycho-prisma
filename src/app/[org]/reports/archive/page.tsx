import { organizationBase } from "@/utils/organization-path";
import { redirect } from "next/navigation";

// Saved reports are now versions on each person's report.
export default function ArchivePage() {
  redirect(`${organizationBase()}/reports`);
}
