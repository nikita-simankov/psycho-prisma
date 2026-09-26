import { organizationBase } from "@/utils/organization-path";
import { redirect } from "next/navigation";

// Archive entries were keyed by person; their report now keeps every saved version.
export default async function ArchiveEntryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`${await organizationBase()}/reports/${params.id}`);
}
