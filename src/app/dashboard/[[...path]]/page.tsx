import { ensureMember } from "@/utils/authentication";
import { redirect } from "next/navigation";

// Old /dashboard links now live under the organization's slug.
const RENAMED: [string, string][] = [
  ["users/teams", "people/teams"],
  ["users/follow-up", "people/follow-up"],
  ["users", "people"],
  ["summary", "reports"],
  ["archive", "reports/archive"],
];

export default async function LegacyDashboardRedirect({ params }: { params: { path?: string[] } }) {
  const { organization } = await ensureMember("viewDashboard");
  let path = (params.path ?? []).join("/");

  for (const [from, to] of RENAMED) {
    if (path === from || path.startsWith(from + "/")) {
      path = to + path.slice(from.length);
      break;
    }
  }

  redirect(`/${organization.slug}${path ? `/${path}` : ""}`);
}
