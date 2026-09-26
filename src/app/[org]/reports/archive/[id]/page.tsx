import { organizationBase } from "@/utils/organization-path";
import { redirect } from "next/navigation";

// Archive entries were keyed by person; their report now keeps every saved version.
export default function ArchiveEntryPage({ params }: { params: { id: string } }) {
  redirect(`${organizationBase()}/reports/${params.id}`);
}
